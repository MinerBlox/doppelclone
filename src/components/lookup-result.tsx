"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductDetails } from "@/components/product-details";
import { parseMarketplaceUrl } from "@/lib/catalog/marketplace";
import { lookupProduct } from "@/lib/lookup/client";
import type { LookupResponse } from "@/lib/lookup/types";

export function LookupResult() {
  const url = useSearchParams().get("url") ?? "";
  return <Result key={url} url={url} />;
}

function Result({ url }: { url: string }) {
  const [result, setResult] = useState<LookupResponse>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const listing = parseMarketplaceUrl(url);
    if (!listing) return;
    const controller = new AbortController();
    void lookupProduct(listing, controller.signal).then(setResult).catch(() => {
      // This lookup was cancelled because the route changed.
    });
    return () => controller.abort();
  }, [url, attempt]);

  if (!parseMarketplaceUrl(url)) {
    return <div className="empty-state"><h1>Invalid product link</h1><p>Paste a direct 1688, Taobao, or Weidian product link into FindThat search.</p></div>;
  }
  if (!result) {
    return <div className="empty-state"><h1>Looking up product</h1><p role="status">Checking the listing with the product provider…</p></div>;
  }
  if (!result.ok) {
    const retryable = result.code === "timeout" || result.code === "provider_unavailable" || result.code === "rate_limited";
    return <div className="empty-state">
      <h1>Could not load the listing</h1>
      <p role="alert">{result.message}</p>
      {retryable ? <button className="agent-more lookup-original" onClick={() => { setResult(undefined); setAttempt(attempt + 1); }}>Try again</button>
        : <Link className="agent-more lookup-original" href="/#discover">Browse demo catalog</Link>}
    </div>;
  }
  return <ProductDetails item={result.product} photos={result.qc.photos}
    live={{ provider: result.product.provider, qcStatus: result.qc.status }} />;
}
