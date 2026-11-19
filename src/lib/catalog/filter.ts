import { parseMarketplaceUrl } from "./marketplace";
import type { CatalogItem, CatalogQuery, Sort } from "./types";

const sorters: Record<Sort, (a: CatalogItem, b: CatalogItem) => number> = {
  featured: (a, b) => a.featuredRank - b.featuredRank,
  newest: (a, b) => b.addedAt.localeCompare(a.addedAt),
  "price-asc": (a, b) => a.priceCny - b.priceCny,
  "price-desc": (a, b) => b.priceCny - a.priceCny,
};

export function filterCatalog(items: readonly CatalogItem[], {
  query = "", category, kind, sellerId, marketplace, qcOnly, sort = "featured",
}: CatalogQuery = {}): CatalogItem[] {
  const listing = parseMarketplaceUrl(query);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  return items.filter((item) => {
    if (category && item.category !== category) return false;
    if (kind && item.kind !== kind) return false;
    if (sellerId && item.seller.id !== sellerId) return false;
    if (marketplace && item.listing.marketplace !== marketplace) return false;
    if (qcOnly && !item.qcCount) return false;
    if (listing) return item.listing.url === listing.url;

    const searchable = [item.name, item.color, item.category, item.kind, item.seller.name, item.listing.marketplace].join(" ").toLowerCase();
    return terms.every((term) => searchable.includes(term));
  }).sort(sorters[sort]);
}
