import { ProviderError } from "./types";

export type Fetch = typeof fetch;

export async function getProviderJson(request: Request, signal: AbortSignal, fetcher: Fetch): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetcher(request.clone(), { signal, redirect: "error" });
    if (response.status === 503 && attempt === 0 && !response.headers.has("Retry-After")) {
      await response.body?.cancel();
      signal.throwIfAborted();
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 404) throw new ProviderError("not_found");
      if (response.status === 429) throw new ProviderError("rate_limited");
      throw new ProviderError("provider_unavailable");
    }
    try {
      return await response.json();
    } catch {
      signal.throwIfAborted();
      throw new ProviderError("provider_unavailable");
    }
  }
  throw new ProviderError("provider_unavailable");
}
