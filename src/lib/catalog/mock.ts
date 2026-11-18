import { listingUrl } from "./marketplace";
import type { Collection, Product, Profile, QcImage, Seller } from "./types";

export const sellers: Seller[] = [
  { id: "south-court", name: "South Court Studio", marketplace: "Weidian", city: "Guangzhou" },
  { id: "form-goods", name: "Form Goods", marketplace: "1688", city: "Hangzhou" },
  { id: "object-room", name: "Object Room", marketplace: "Taobao", city: "Shanghai" },
];

const entries = [
  ["court-01", "Court 01 Sneaker", "Chalk / Pine", "Footwear", 189, 0, "7310045601", "2026-11-16", "Cream suede court sneakers with dark green accents"],
  ["work-jacket", "Washed Canvas Work Jacket", "Charcoal", "Outerwear", 268, 1, "830104561002", "2026-11-14", "Charcoal canvas jacket with a zip front and pointed collar"],
  ["crescent-bag", "Ripstop Crescent Bag", "Olive", "Bags", 89, 2, "845104561003", "2026-11-17", "Olive ripstop shoulder bag with an adjustable strap"],
  ["rectangular-watch", "Rectangular Steel Watch", "Brushed silver", "Accessories", 159, 2, "845104561004", "2026-11-12", "Rectangular analog watch with a steel bracelet"],
  ["heavyweight-crew", "Heavyweight Fleece Crew", "Oat", "Clothing", 119, 1, "830104561005", "2026-11-11", "Oat coloured heavyweight fleece sweatshirt"],
  ["trail-runner", "Terrain Trail Runner", "Black", "Footwear", 229, 0, "7310045606", "2026-11-18", "Black trail running shoe with a grippy outsole"],
] as const;

export const products: Product[] = entries.map(
  ([slug, name, color, category, priceCny, sellerIndex, itemId, addedAt, alt], featuredRank) => {
    const seller = sellers[sellerIndex];
    return {
      slug, name, color, category, priceCny, addedAt, featuredRank, sellerId: seller.id,
      listing: { marketplace: seller.marketplace, itemId, url: listingUrl(seller.marketplace, itemId) },
      photo: { src: `/catalog/${slug}.webp`, alt },
    };
  },
);

export const qcImages: QcImage[] = [
  { id: "court-front", productSlug: "court-01", view: "front", capturedAt: "2026-11-16", src: "/catalog/qc-court-front.webp", alt: "Sample warehouse photo showing the sneakers from above" },
  { id: "court-sole", productSlug: "court-01", view: "sole", capturedAt: "2026-11-16", src: "/catalog/qc-court-sole.webp", alt: "Sample warehouse photo showing the sneaker outsole" },
  { id: "jacket-front", productSlug: "work-jacket", view: "front", capturedAt: "2026-11-14", src: "/catalog/qc-jacket-front.webp", alt: "Sample warehouse photo showing the jacket laid flat beside a measuring tape" },
  { id: "jacket-seam", productSlug: "work-jacket", view: "construction", capturedAt: "2026-11-14", src: "/catalog/qc-jacket-seam.webp", alt: "Sample warehouse photo of the jacket zipper and seam construction" },
];

export const collections: Collection[] = [{
  slug: "everyday-uniform",
  title: "Everyday uniform",
  description: "Easy layers, practical fabrics, and a palette that goes together.",
  ownerHandle: "mei",
  productSlugs: ["court-01", "work-jacket", "crescent-bag"],
}];

export const profiles: Profile[] = [{
  handle: "mei",
  displayName: "Mei Lin",
  bio: "Practical layers and everyday objects.",
}];
