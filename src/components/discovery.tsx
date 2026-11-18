"use client";

import { ArrowRight, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DiscoveryControls, DiscoverySearch } from "@/components/discovery-controls";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { filterCatalog } from "@/lib/catalog/filter";
import { categories, marketplaces, sorts, type CatalogItem, type CatalogQuery, type QcImage } from "@/lib/catalog/types";

export function Discovery({ items, photosBySlug }: {
  items: CatalogItem[];
  photosBySlug: Record<string, QcImage[]>;
}) {
  const [state, setState] = useState<CatalogQuery>({});
  const [draft, setDraft] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const results = filterCatalog(items, state);
  const filtered = Boolean(state.query || state.category || state.marketplace || state.qcOnly || (state.sort && state.sort !== "featured"));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.size) return;
    const query = params.get("q")?.trim().slice(0, 1000) ?? "";
    setDraft(query);
    setState({
      query,
      category: categories.find((category) => category === params.get("category")),
      marketplace: marketplaces.find((marketplace) => marketplace === params.get("source")),
      qcOnly: params.get("qc") === "1",
      sort: sorts.find((sort) => sort === params.get("sort")),
    });
  }, []);

  function updateFilters(patch: Partial<CatalogQuery>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function reset() {
    setDraft("");
    setState({});
  }

  return (
    <main id="main">
      <section className="shell hero" aria-labelledby="hero-title">
        <h1 id="hero-title">
          <span className="hero-wordmark">findthat.net</span>
          <span className="hero-signal" aria-hidden="true">findthat.net</span>
          <svg className="hero-signal-defs" aria-hidden="true" width="0" height="0">
            <defs>
              <filter id="letter-wave" x="-15%" y="-40%" width="130%" height="180%" primitiveUnits="objectBoundingBox">
                <feMorphology in="SourceGraphic" operator="dilate" radius=".004 .018" result="outer">
                  <animate attributeName="radius" values=".004 .018;.021 .092;.021 .092" keyTimes="0;.75;1" dur="4s" repeatCount="indefinite" />
                </feMorphology>
                <feMorphology in="SourceGraphic" operator="dilate" radius=".002 .009" result="inner">
                  <animate attributeName="radius" values=".002 .009;.019 .083;.019 .083" keyTimes="0;.75;1" dur="4s" repeatCount="indefinite" />
                </feMorphology>
                <feComposite in="outer" in2="inner" operator="out" result="wave" />
                <feMorphology in="SourceGraphic" operator="dilate" radius=".012 .052" result="echoOuter">
                  <animate attributeName="radius" values=".012 .052;.029 .126;.029 .126" keyTimes="0;.75;1" dur="4s" repeatCount="indefinite" />
                </feMorphology>
                <feMorphology in="SourceGraphic" operator="dilate" radius=".010 .043" result="echoInner">
                  <animate attributeName="radius" values=".010 .043;.027 .117;.027 .117" keyTimes="0;.75;1" dur="4s" repeatCount="indefinite" />
                </feMorphology>
                <feComposite in="echoOuter" in2="echoInner" operator="out" />
                <feComponentTransfer><feFuncA type="linear" slope=".55" /></feComponentTransfer>
                <feMerge><feMergeNode in="wave" /><feMergeNode /></feMerge>
              </filter>
            </defs>
          </svg>
        </h1>
        <p className="hero-description">China: Made easy. Get more, for less.</p>
        <DiscoverySearch query={draft} onChange={setDraft} onSearch={() => {
          setState({ query: draft.trim() });
          heading.current?.focus();
        }} />
        <div className="hero-sources" role="group" aria-label="Explore by marketplace">
          <span>Explore</span>
          {marketplaces.map((marketplace) => (
            <button key={marketplace} type="button" aria-pressed={state.marketplace === marketplace}
              onClick={() => {
                updateFilters({ marketplace: state.marketplace === marketplace ? undefined : marketplace });
                heading.current?.focus();
              }}>{marketplace}</button>
          ))}
        </div>
      </section>

      <section id="discover" className="shell catalog" aria-labelledby="discover-title">
        <div className="catalog-heading">
          <h2 id="discover-title" ref={heading} tabIndex={-1}>Discover</h2>
          <div className="catalog-summary">
            <span role="status">{results.length} {results.length === 1 ? "item" : "items"}</span>
            {filtered && <button type="button" onClick={reset}>Clear filters</button>}
          </div>
        </div>
        <div className="catalog-controls"><DiscoveryControls state={state} onChange={updateFilters} /></div>
        {results.length ? (
          <div className="product-grid">
            {results.map((item) => <ProductCard key={item.slug} item={item} qcImages={photosBySlug[item.slug] ?? []}
              priority={item.slug === items[0]?.slug} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No matching items</h3>
            <p>Try a different search or clear your filters to see the sample catalog.</p>
            <Button type="button" variant="outline" onClick={reset}>See all items</Button>
          </div>
        )}
      </section>

      <section id="qc" className="shell qc-section" aria-labelledby="qc-title">
        <div className="qc-panel">
          <div className="qc-icon"><ScanLine size={22} strokeWidth={1.5} aria-hidden="true" /></div>
          <div>
            <h2 id="qc-title">Quality check photos</h2>
            <p>Open a product to inspect sample warehouse photos of its materials and construction.</p>
          </div>
          <Button type="button" variant="outline" className="qc-action" onClick={() => {
            setDraft("");
            setState({ qcOnly: true });
            heading.current?.focus();
          }}>Browse QC photos <ArrowRight size={15} aria-hidden="true" /></Button>
        </div>
      </section>
    </main>
  );
}
