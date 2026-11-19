import { listingUrl } from "./marketplace";
import type { Collection, Product, Profile, QcImage, Seller } from "./types";

export const sellers: Seller[] = [
  { id: "south-court", name: "South Court Studio", marketplace: "Weidian", city: "Guangzhou" },
  { id: "form-goods", name: "Form Goods", marketplace: "1688", city: "Hangzhou" },
  { id: "object-room", name: "Object Room", marketplace: "Taobao", city: "Shanghai" },
];

const entries = [
  ["court-01", "Court 01 Sneaker", "Chalk / Pine", "Footwear", "Shoes", 189, 0, "7310045601", "2026-11-16", "Cream suede court sneakers with dark green accents"],
  ["work-jacket", "Washed Canvas Work Jacket", "Charcoal", "Outerwear", "Jackets", 268, 1, "830104561002", "2026-11-14", "Charcoal canvas jacket with a zip front and pointed collar"],
  ["crescent-bag", "Ripstop Crescent Bag", "Olive", "Bags", "Accessories", 89, 2, "845104561003", "2026-11-17", "Olive ripstop shoulder bag with an adjustable strap"],
  ["rectangular-watch", "Rectangular Steel Watch", "Brushed silver", "Accessories", "Watches", 159, 2, "845104561004", "2026-11-12", "Rectangular analog watch with a steel bracelet"],
  ["heavyweight-crew", "Heavyweight Fleece Crew", "Oat", "Clothing", "Sweats", 119, 1, "830104561005", "2026-11-11", "Oat coloured heavyweight fleece sweatshirt"],
  ["trail-runner", "Terrain Trail Runner", "Black", "Footwear", "Shoes", 229, 0, "7310045606", "2026-11-18", "Black trail running shoe with a grippy outsole"],
  ["compact-cotton-tee", "Compact Cotton Tee", "Ivory", "Clothing", "Tees", 79, 1, "830104561017", "2026-11-19", "Heavyweight ivory T-shirt laid flat"],
  ["quilted-puffer", "Quilted Stand Collar Puffer", "Black", "Outerwear", "Puffers", 329, 1, "830104561018", "2026-11-19", "Black puffer with horizontal quilting and a stand collar"],
  ["loopback-hoodie", "Loopback Pullover Hoodie", "Heather grey", "Clothing", "Hoodies", 149, 2, "845104561019", "2026-11-19", "Grey pullover hoodie with a kangaroo pocket"],
  ["straight-indigo-jeans", "Straight Indigo Jeans", "Dark indigo", "Clothing", "Jeans", 199, 2, "845104561020", "2026-11-19", "Dark indigo straight leg jeans laid flat"],
] as const;

export const products: Product[] = entries.map(
  ([slug, name, color, category, kind, priceCny, sellerIndex, itemId, addedAt, alt], featuredRank) => {
    const seller = sellers[sellerIndex];
    return {
      slug, name, color, category, kind, priceCny, addedAt, featuredRank, sellerId: seller.id,
      listing: { marketplace: seller.marketplace, itemId, url: listingUrl(seller.marketplace, itemId) },
      photo: { src: `/catalog/${slug}.webp`, alt },
    };
  },
);

export const qcImages: QcImage[] = [
  { id: "court-front", groupId: "court-sample", productSlug: "court-01", view: "front", capturedAt: "2026-11-16", src: "/catalog/qc-court-front.webp", alt: "Sample warehouse photo showing the sneakers from above" },
  { id: "court-sole", groupId: "court-sample", productSlug: "court-01", view: "sole", capturedAt: "2026-11-16", src: "/catalog/qc-court-sole.webp", alt: "Sample warehouse photo showing the sneaker outsole" },
  { id: "jacket-front", groupId: "jacket-sample", productSlug: "work-jacket", view: "front", capturedAt: "2026-11-14", src: "/catalog/qc-jacket-front.webp", alt: "Sample warehouse photo showing the jacket laid flat beside a measuring tape" },
  { id: "jacket-seam", groupId: "jacket-sample", productSlug: "work-jacket", view: "construction", capturedAt: "2026-11-14", src: "/catalog/qc-jacket-seam.webp", alt: "Sample warehouse photo of the jacket zipper and seam construction" },
];

export const collections: Collection[] = [{
  slug: "everyday-uniform",
  title: "Everyday uniform",
  description: "Easy layers, practical fabrics, and a palette that goes together.",
  ownerHandle: "mei",
  productSlugs: ["court-01", "work-jacket", "crescent-bag"],
}, {
  slug: "weekend-layers",
  title: "Weekend layers",
  description: "Soft grey fleece, dark denim, and a pair of court sneakers.",
  ownerHandle: "mei",
  productSlugs: ["loopback-hoodie", "straight-indigo-jeans", "court-01"],
}];

export const profiles: Profile[] = [{
  handle: "mei",
  displayName: "Mei Lin",
  bio: "Practical layers and everyday objects.",
}];
