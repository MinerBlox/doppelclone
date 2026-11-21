import type { SourceListing } from "../catalog/types";
import type { LookupResponse } from "./types";
import { savedListing } from "./saved-listing";

const base = process.env.NEXT_PUBLIC_LOOKUP_API_URL;
type Success = Extract<LookupResponse, { ok: true }>;
let lastResult: { url: string; value: Success; expires: number } | undefined;

export function lookupResultUrl(listing: SourceListing) {
  return "/lookup/?url=" + encodeURIComponent(listing.url);
}

export async function lookupProduct(listing: SourceListing, signal: AbortSignal): Promise<LookupResponse> {
  signal.throwIfAborted();
  if (lastResult?.url === listing.url && Date.now() < lastResult.expires) return lastResult.value;
  if (!base) return savedListing(listing) ?? {
    ok: false, code: "not_configured",
    message: "Live lookup is not connected on this site yet. You can still browse the demo catalog below.",
  };

  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const endpoint = new URL("/v1/product", base);
    endpoint.searchParams.set("url", listing.url);
    const response = await fetch(endpoint, { signal: controller.signal });
    const result: LookupResponse = await response.json();
    if (response.ok && result.ok === true && result.product?.listing?.url === listing.url) {
      lastResult = { url: listing.url, value: result, expires: Date.now() + 60_000 };
      return result;
    }
    if (!response.ok && result.ok === false && typeof result.message === "string") return result;
    throw new Error("Lookup response did not match the request");
  } catch {
    signal.throwIfAborted();
    if (controller.signal.aborted) return { ok: false, code: "timeout", message: "The lookup took too long. Try again in a moment." };
    return { ok: false, code: "provider_unavailable", message: "FindThat could not reach the product lookup service. Try again later." };
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}
