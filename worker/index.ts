import { parseMarketplaceUrl } from "../src/lib/catalog/marketplace";
import type { LookupResponse } from "../src/lib/lookup/types";
import { create1688Provider } from "./providers/1688";
import type { Fetch } from "./providers/http";
import { createLitBuyProvider } from "./providers/litbuy";
import { lookupFailure, resolveListing } from "./providers/resolver";

export interface Env {
  NEXSCOPE_API_KEY?: string;
  LOOKUP_PROVIDER?: string;
  LOOKUP_1688_PROVIDER?: string;
  ALLOWED_ORIGINS: string;
  LOOKUP_RATE_LIMIT?: { limit(input: { key: string }): Promise<{ success: boolean }> };
}

interface ExecutionContext { waitUntil(promise: Promise<unknown>): void }
type LookupCache = Pick<Cache, "match" | "put">;

const statuses = {
  invalid_url: 400, not_configured: 503, not_found: 404,
  provider_unavailable: 502, timeout: 504, rate_limited: 429,
};

export async function handleLookup(
  request: Request, env: Env, context: ExecutionContext, cache?: LookupCache,
  fetcher: Fetch = (input, init) => fetch(input, init),
): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const cors = new Headers({ Vary: "Origin", "Cache-Control": "no-store" });
  if (origin && !env.ALLOWED_ORIGINS.split(",").some((entry) => entry.trim() === origin)) {
    return new Response(null, { status: 403, headers: cors });
  }
  if (origin) cors.set("Access-Control-Allow-Origin", origin);
  if (url.pathname !== "/v1/product") return new Response(null, { status: 404, headers: cors });
  if (request.method === "OPTIONS") {
    cors.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    cors.set("Access-Control-Max-Age", "600");
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== "GET") {
    cors.set("Allow", "GET, OPTIONS");
    return new Response(null, { status: 405, headers: cors });
  }
  const respond = (result: LookupResponse) => {
    if (!result.ok && result.code === "rate_limited") cors.set("Retry-After", "60");
    return Response.json(result, { status: result.ok ? 200 : statuses[result.code], headers: cors });
  };

  const inputs = url.searchParams.getAll("url");
  const listing = inputs.length === 1 ? parseMarketplaceUrl(inputs[0]) : null;
  if (!listing) return respond(lookupFailure("invalid_url"));
  const source = env.LOOKUP_PROVIDER ?? env.LOOKUP_1688_PROVIDER ?? "nexscope";
  const apiKey = env.NEXSCOPE_API_KEY?.trim();
  const provider = source === "litbuy" ? createLitBuyProvider(listing.marketplace, fetcher)
    : source === "nexscope" && listing.marketplace === "1688" && apiKey ? create1688Provider(apiKey, fetcher) : undefined;
  if (!provider) return respond(lookupFailure("not_configured"));

  const key = new Request(new URL(`/_cache/product/v2/${source}/${listing.marketplace.toLowerCase()}/${listing.itemId}`, url.origin));
  const cached = await cache?.match(key).catch(() => undefined);
  if (cached) {
    cors.set("Content-Type", "application/json");
    return new Response(cached.body, { status: 200, headers: cors });
  }

  if (env.LOOKUP_RATE_LIMIT) {
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    try {
      const limit = await env.LOOKUP_RATE_LIMIT.limit({ key: ip });
      if (!limit.success) return respond(lookupFailure("rate_limited"));
    } catch {
      // Do not turn a broken quota guard into unlimited billable upstream calls.
      return respond(lookupFailure("provider_unavailable"));
    }
  }

  const result = await resolveListing(listing, [provider]);
  if (result.ok && cache) {
    const response = Response.json(result, { headers: { "Cache-Control": "public, max-age=300" } });
    context.waitUntil(cache.put(key, response).catch(() => undefined));
  }
  return respond(result);
}

export default {
  fetch(request: Request, env: Env, context: ExecutionContext) {
    const cache = (globalThis.caches as (CacheStorage & { default?: Cache }) | undefined)?.default;
    return handleLookup(request, env, context, cache);
  },
};
