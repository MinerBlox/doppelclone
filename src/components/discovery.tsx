"use client";

import { ArrowRight, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DiscoveryControls, DiscoverySearch } from "@/components/discovery-controls";
import { ProductCard } from "@/components/product-card";
import { CategoryTiles } from "@/components/category-tiles";
import { DiscoverSections, DiscoverSectionContent, type DiscoverSection } from "@/components/discover-sections";
import { Button } from "@/components/ui/button";
import { filterCatalog } from "@/lib/catalog/filter";
import { looksLikeUrl, parseMarketplaceUrl } from "@/lib/catalog/marketplace";
import { lookupProduct, lookupResultUrl } from "@/lib/lookup/client";
import { categories, marketplaces, productKinds, sorts, type CatalogItem, type CatalogQuery, type Collection } from "@/lib/catalog/types";

export function Discovery({ items, collections }: { items: CatalogItem[]; collections: Collection[] }) {
  const [state, setState] = useState<CatalogQuery>({});
  const [draft, setDraft] = useState("");
  const [section, setSection] = useState<DiscoverSection>("popular");
  const [outfit, setOutfit] = useState<string>();
  const [lookupState, setLookupState] = useState<{ status: "loading" | "error"; message: string }>();
  const pendingLookup = useRef<AbortController>(null);
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const collection = collections.find(({ slug }) => slug === outfit);
  const results = filterCatalog(collection ? items.filter(({ slug }) => collection.productSlugs.includes(slug)) : items, state);
  const activeLabel = collection?.title ?? state.kind ?? items.find(({ seller }) => seller.id === state.sellerId)?.seller.name;
  const filtered = Boolean(activeLabel || state.query || state.category || state.marketplace || state.qcOnly || (state.sort && state.sort !== "featured"));

  useEffect(() => () => pendingLookup.current?.abort(), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.size) return;
    const query = params.get("q")?.trim().slice(0, 1000) ?? "";
    setDraft(query);
    setState({
      query,
      category: categories.find((category) => category === params.get("category")),
      kind: productKinds.find((kind) => kind === params.get("kind")),
      marketplace: marketplaces.find((marketplace) => marketplace === params.get("source")),
      qcOnly: params.get("qc") === "1",
      sort: sorts.find((sort) => sort === params.get("sort")),
    });
  }, []);

  function updateFilters(patch: Partial<CatalogQuery>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function reset() {
    pendingLookup.current?.abort();
    setLookupState(undefined);
    setDraft("");
    setState({});
    setOutfit(undefined);
    setSection("popular");
  }

  async function search() {
    const query = draft.trim();
    if (!looksLikeUrl(query)) {
      reset();
      setDraft(draft);
      setState({ query });
      heading.current?.focus();
      return;
    }

    pendingLookup.current?.abort();
    const listing = parseMarketplaceUrl(query);
    if (!listing) {
      setLookupState({ status: "error", message: "Paste a direct 1688, Taobao, or Weidian product link." });
      return;
    }
    const controller = new AbortController();
    pendingLookup.current = controller;
    setLookupState({ status: "loading", message: `Looking up this ${listing.marketplace} listing…` });
    try {
      const result = await lookupProduct(listing, controller.signal);
      if (controller.signal.aborted) return;
      if (result.ok) router.push(lookupResultUrl(listing));
      else setLookupState({ status: "error", message: result.message });
    } catch {
      // A newer search or route change cancelled this lookup.
    }
  }

  return (
    <main id="main">
      <section className="shell hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="striped-wordmark" data-shadow="findthat.net">findthat.net</h1>
        <p className="hero-description">China: Made easy. Get more, for less.</p>
        <DiscoverySearch query={draft} pending={lookupState?.status === "loading"} onChange={(value) => {
          pendingLookup.current?.abort();
          setLookupState(undefined);
          setDraft(value);
        }} onSearch={() => void search()} />
        {lookupState && <p className="style-photo-note" role={lookupState.status === "error" ? "alert" : "status"}>
          {lookupState.message}
        </p>}
        <div className="hero-sources" role="group" aria-label="Explore by marketplace">
          <span>Explore</span>
          {marketplaces.map((marketplace) => (
            <button key={marketplace} type="button" aria-pressed={state.marketplace === marketplace}
              onClick={() => {
                setSection("popular");
                updateFilters({ marketplace: state.marketplace === marketplace ? undefined : marketplace });
                heading.current?.focus();
              }}>{marketplace}</button>
          ))}
        </div>
        <CategoryTiles items={items} selected={state.kind} onSelect={(kind) => {
          const selected = state.kind === kind ? undefined : kind;
          reset();
          setState({ kind: selected });
          heading.current?.focus();
        }} />
      </section>

      <section id="discover" className="shell catalog" aria-labelledby="discover-title">
        <div className="discover-section-band"><DiscoverSections active={section} onSelect={setSection} /></div>
        <div className="catalog-heading">
          <h2 id="discover-title" ref={heading} tabIndex={-1}>Discover</h2>
        </div>
        {section !== "popular" ? (
          <DiscoverSectionContent active={section} items={items} collections={collections}
            onSeller={(sellerId) => { reset(); setState({ sellerId }); heading.current?.focus(); }}
            onOutfit={(slug) => { reset(); setOutfit(slug); heading.current?.focus(); }} />
        ) : <>
          <div className="catalog-toolbar">
            <div className="catalog-summary">
              <span role="status">{activeLabel && `${activeLabel} · `}{results.length} {results.length === 1 ? "item" : "items"} · Demo catalog</span>
              {filtered && <button type="button" onClick={reset}>Clear filters</button>}
            </div>
            <DiscoveryControls state={state} onChange={updateFilters} />
          </div>
        {results.length ? (
          <div className="product-grid">
            {results.map((item) => <ProductCard key={item.slug} item={item}
              priority={item.slug === items[0]?.slug} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No matching items</h3>
            <p>Try a different search or clear your filters to see the sample catalog.</p>
            <Button type="button" variant="outline" onClick={reset}>See all items</Button>
          </div>
        )}
        </>}
      </section>

      <section id="qc" className="shell qc-section" aria-labelledby="qc-title">
        <div className="qc-panel">
          <div className="qc-icon"><ScanLine size={22} strokeWidth={1.5} aria-hidden="true" /></div>
          <div>
            <h2 id="qc-title">Quality check photos</h2>
            <p>Open a product to inspect its sample warehouse photos and browse the full group.</p>
          </div>
          <Button type="button" variant="outline" className="qc-action" onClick={() => {
            reset();
            setState({ qcOnly: true });
            heading.current?.focus();
          }}>Browse QC photos <ArrowRight size={15} aria-hidden="true" /></Button>
        </div>
      </section>
    </main>
  );
}
