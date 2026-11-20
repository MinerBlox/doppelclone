import * as Select from "@radix-ui/react-select";
import { ArrowRight, Check, ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marketplaces, sorts, type CatalogQuery, type Sort } from "@/lib/catalog/types";

const sortLabels: Record<Sort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

export function FilterSelect({ label, value, displayValue, className, options, onChange }: {
  label: string;
  value: string;
  displayValue?: string;
  className?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className={cn("filter-select-trigger", className)} aria-label={label}>
        <Select.Value>{displayValue ?? options.find((option) => option.value === value)?.label}</Select.Value>
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
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const activeCount = Number(Boolean(state.marketplace)) + Number(Boolean(state.sort && state.sort !== "featured")) + Number(Boolean(state.qcOnly));
  return (
    <div className="filter-inline" data-expanded={expanded}>
      <button type="button" className="filter-disclosure" aria-expanded={expanded} aria-controls={id}
        onClick={() => setExpanded((current) => !current)}>
        <SlidersHorizontal size={15} strokeWidth={1.7} aria-hidden="true" />
        Filters{activeCount > 0 && <span className="filter-count">{activeCount}</span>}
      </button>
      <div id={id} className="filter-inline-controls" inert={!expanded} aria-hidden={!expanded}
        role="group" aria-label="Filter and sort products">
          <div className="filter-field">
            <span className="filter-label" aria-hidden="true">Marketplace</span>
            <FilterSelect label="Marketplace" value={state.marketplace ?? "all"} options={marketplaceOptions}
              onChange={(source) => onChange({ marketplace: marketplaces.find((marketplace) => marketplace === source) })} />
          </div>
          <div className="filter-field">
            <span className="filter-label" aria-hidden="true">Sort by</span>
            <FilterSelect label="Sort products" value={state.sort ?? "featured"} options={sortOptions}
              onChange={(value) => onChange({ sort: sorts.find((sort) => sort === value) })} />
          </div>
          <label className="qc-toggle">
            <span>QC only</span>
            <input className="sr-only" type="checkbox" role="switch" checked={state.qcOnly ?? false}
              onChange={(event) => onChange({ qcOnly: event.currentTarget.checked })} />
            <span className="qc-switch-track" aria-hidden="true" />
          </label>
      </div>
    </div>
  );
}
