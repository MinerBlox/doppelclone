import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, marketplaces, sorts, type CatalogQuery, type Sort } from "@/lib/catalog/types";

const sortLabels: Record<Sort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export function DiscoverySearch({ query, onChange, onSearch }: {
  query: string;
  onChange: (query: string) => void;
  onSearch: () => void;
}) {
  return (
    <form role="search" className="discovery-search" onSubmit={(event) => {
      event.preventDefault();
      onSearch();
    }}>
      <Search size={21} strokeWidth={1.6} aria-hidden="true" />
      <label htmlFor="discovery-query" className="sr-only">Search products or paste a marketplace link</label>
      <input id="discovery-query" name="q" type="search" value={query} onChange={(event) => onChange(event.target.value)}
        placeholder="Search products or paste a link" maxLength={1000} />
      <Button type="submit" className="search-submit">
        Search <ArrowRight size={15} aria-hidden="true" />
      </Button>
    </form>
  );
}

export function DiscoveryControls({ state, onChange }: {
  state: CatalogQuery;
  onChange: (patch: Partial<CatalogQuery>) => void;
}) {
  return (
    <>
      <div role="group" aria-label="Product categories" className="category-nav">
        <button type="button" aria-pressed={!state.category} onClick={() => onChange({ category: undefined })}>
          All items
        </button>
        {categories.map((category) => <button key={category} type="button" aria-pressed={category === state.category}
          onClick={() => onChange({ category })}>{category}</button>)}
      </div>
      <div className="filter-form" role="group" aria-label="Filter and sort products">
        <div>
          <label className="sr-only" htmlFor="filter-source">Marketplace</label>
          <select id="filter-source" value={state.marketplace ?? ""} onChange={(event) => {
            const source = event.currentTarget.value;
            onChange({ marketplace: marketplaces.find((marketplace) => marketplace === source) });
          }}>
            <option value="">All marketplaces</option>
            {marketplaces.map((source) => <option key={source}>{source}</option>)}
          </select>
        </div>
        <div>
          <label className="sr-only" htmlFor="filter-sort">Sort products</label>
          <select id="filter-sort" value={state.sort ?? "featured"} onChange={(event) => {
            const value = event.currentTarget.value;
            onChange({ sort: sorts.find((sort) => sort === value) });
          }}>
            {sorts.map((sort) => <option key={sort} value={sort}>{sortLabels[sort]}</option>)}
          </select>
        </div>
        <label className="qc-toggle">
          <input type="checkbox" checked={state.qcOnly ?? false}
            onChange={(event) => onChange({ qcOnly: event.currentTarget.checked })} /> QC only
        </label>
      </div>
    </>
  );
}
