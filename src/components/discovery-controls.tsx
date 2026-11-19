import * as Select from "@radix-ui/react-select";
import { ArrowRight, Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketplaces, sorts, type CatalogQuery, type Sort } from "@/lib/catalog/types";

const sortLabels: Record<Sort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="filter-select-trigger" aria-label={label}>
        <Select.Value />
        <Select.Icon asChild><ChevronDown size={15} strokeWidth={1.7} aria-hidden="true" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="filter-select-menu" position="popper" sideOffset={7} collisionPadding={12}>
          <Select.Viewport>
            {options.map((option) => <Select.Item key={option.value} value={option.value} className="filter-select-option">
              <Select.ItemText>{option.label}</Select.ItemText>
              <Select.ItemIndicator><Check size={16} strokeWidth={1.8} aria-hidden="true" /></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

const marketplaceOptions = [
  { value: "all", label: "All marketplaces" },
  ...marketplaces.map((source) => ({ value: source, label: source })),
];
const sortOptions = sorts.map((sort) => ({ value: sort, label: sortLabels[sort] }));

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
      <div className="filter-form" role="group" aria-label="Filter and sort products">
        <FilterSelect label="Marketplace" value={state.marketplace ?? "all"} options={marketplaceOptions}
          onChange={(source) => onChange({ marketplace: marketplaces.find((marketplace) => marketplace === source) })} />
        <FilterSelect label="Sort products" value={state.sort ?? "featured"} options={sortOptions}
          onChange={(value) => onChange({ sort: sorts.find((sort) => sort === value) })} />
        <label className="qc-toggle">
          <input type="checkbox" checked={state.qcOnly ?? false}
            onChange={(event) => onChange({ qcOnly: event.currentTarget.checked })} /> QC only
        </label>
      </div>
  );
}
