import Image from "next/image";
import { ArrowDownToLine, ArrowRight, FileSpreadsheet, Layers3, Store, TrendingUp } from "lucide-react";
import { publicAsset } from "@/lib/utils";
import type { CatalogItem, Collection } from "@/lib/catalog/types";

const sections = [
  { id: "popular", label: "Popular", description: "Explore the catalog", icon: TrendingUp, photo: "/catalog/court-01.webp" },
  { id: "sellers", label: "Sellers", description: "Find a shop", icon: Store, photo: "/catalog/work-jacket.webp" },
  { id: "spreadsheets", label: "Spreadsheets", description: "Take your finds with you", icon: FileSpreadsheet },
  { id: "outfits", label: "Outfits", description: "Shop pieces together", icon: Layers3, photo: "/catalog/straight-indigo-jeans.webp" },
] as const;

export type DiscoverSection = (typeof sections)[number]["id"];

export function DiscoverSections({ active, onSelect }: {
  active: DiscoverSection; onSelect: (section: DiscoverSection) => void;
}) {
  return (
    <div className="discover-sections" role="group" aria-label="Discover sections">
      {sections.map(({ id, label, description, icon: Icon, ...section }) => (
        <button key={id} type="button" className={`section-card section-card-${id}`}
          aria-label={label} aria-pressed={active === id} onClick={() => onSelect(id)}>
          <span className="section-card-content">
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <strong>{label}</strong>
            <span>{description}</span>
          </span>
          {"photo" in section && <Image src={publicAsset(section.photo)} alt="" fill sizes="(max-width: 620px) 40vw, 240px" />}
        </button>
      ))}
    </div>
  );
}

function exportCatalog(items: CatalogItem[]) {
  const header = ["Product", "Category", "Seller", "Marketplace", "Price (CNY)", "FindThat page"];
  const rows = items.map((item) => [
    item.name, item.kind, item.seller.name, item.listing.marketplace,
    String(item.priceCny), new URL(publicAsset(`/products/${item.slug}/`), window.location.origin).href,
  ]);
  const csv = [header, ...rows].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "findthat-catalog.csv";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DiscoverSectionContent({ active, items, collections, onSeller, onOutfit }: {
  active: Exclude<DiscoverSection, "popular">;
  items: CatalogItem[];
  collections: Collection[];
  onSeller: (id: string) => void;
  onOutfit: (slug: string) => void;
}) {
  if (active === "spreadsheets") {
    return <div className="discover-download">
      <span className="section-detail-icon"><FileSpreadsheet size={22} aria-hidden="true" /></span>
      <div><h3>FindThat catalog</h3><p>{items.length} items with prices, sellers, and product page links. Opens in Excel or Google Sheets.</p></div>
      <button type="button" className="discover-download-button" onClick={() => exportCatalog(items)}>
        <ArrowDownToLine size={17} aria-hidden="true" /> Download CSV
      </button>
    </div>;
  }
  if (active === "sellers") {
    const sellers = [...new Map(items.map(({ seller }) => [seller.id, seller])).values()];
    return <div className="discover-directory">
      {sellers.map((seller) => <button type="button" key={seller.id} onClick={() => onSeller(seller.id)}>
        <span className="section-detail-icon"><Store size={19} aria-hidden="true" /></span>
        <span><strong>{seller.name}</strong><small>{seller.marketplace} · {seller.city}</small></span>
        <ArrowRight size={16} aria-hidden="true" />
      </button>)}
    </div>;
  }
  return <div className="discover-directory">
    {collections.map((collection) => <button type="button" key={collection.slug} onClick={() => onOutfit(collection.slug)}>
      <span className="section-detail-icon"><Layers3 size={19} aria-hidden="true" /></span>
      <span><strong>{collection.title}</strong><small>{collection.description}</small></span>
      <ArrowRight size={16} aria-hidden="true" />
    </button>)}
  </div>;
}
