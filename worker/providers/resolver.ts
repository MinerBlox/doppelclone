import type { SourceListing } from "../../src/lib/catalog/types";
import type { LookupErrorCode, LookupResponse } from "../../src/lib/lookup/types";
import { ProviderError, type ProductProvider, type QcProvider } from "./types";

const messages: Record<LookupErrorCode, string> = {
  invalid_url: "Paste a direct 1688, Taobao, or Weidian product link.",
  not_configured: "Live lookup for this marketplace is not connected yet.",
  not_found: "The provider could not find this listing. Check that the original link still opens.",
  provider_unavailable: "The product provider is unavailable right now. Try again later.",
  timeout: "The product provider took too long. Try again in a moment.",
  rate_limited: "Too many lookups. Wait a moment and try again.",
};

export function lookupFailure(code: LookupErrorCode): LookupResponse {
  return { ok: false, code, message: messages[code] };
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new ProviderError("timeout"));
          controller.abort();
        }, ms);
      }),
      run(controller.signal),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function resolveListing(
  listing: SourceListing,
  productProviders: readonly ProductProvider[],
  qcProviders: readonly QcProvider[] = [],
  timeoutMs = 6000,
): Promise<LookupResponse> {
  const provider = productProviders.find((candidate) => candidate.marketplace === listing.marketplace);
  if (!provider) return lookupFailure("not_configured");
  try {
    const product = await withTimeout((signal) => provider.getProduct(listing, signal), timeoutMs);
    const agents = qcProviders.filter((agent) => agent.supports(listing.marketplace));
    const results = await Promise.allSettled(agents.map(async (agent) => {
      const photos = await withTimeout((signal) => agent.getPhotos(listing, signal), Math.min(timeoutMs, 2500));
      return photos.map((photo) => ({
        ...photo,
        // Group IDs are scoped by source in the gallery, even when providers use the same ID.
        sourceAgent: agent.agent,
        originalProductId: listing.itemId,
      }));
    }));
    const photos = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    const status = photos.length ? "available"
      : agents.length && results.every((result) => result.status === "fulfilled") ? "none" : "unavailable";
    return { ok: true, product, qc: { status, photos } };
  } catch (error) {
    return lookupFailure(error instanceof ProviderError ? error.code : "provider_unavailable");
  }
}
