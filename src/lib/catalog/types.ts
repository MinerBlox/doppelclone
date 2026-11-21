export const marketplaces = ["1688", "Weidian", "Taobao"] as const;
export type Marketplace = (typeof marketplaces)[number];

export const categories = ["Footwear", "Outerwear", "Clothing", "Bags", "Accessories"] as const;
export type Category = (typeof categories)[number];
export const productKinds = ["Shoes", "Tees", "Jackets", "Puffers", "Accessories", "Watches", "Hoodies", "Sweats", "Jeans"] as const;
export type ProductKind = (typeof productKinds)[number];

export interface SourceListing {
  marketplace: Marketplace;
  itemId: string;
  url: string;
}

export interface Seller {
  id: string;
  name: string;
  marketplace: Marketplace;
  city: string;
  metrics?: {
    averageShippingDays: number;
    averageRating: number;
    reviewCount: number;
    sample?: boolean;
  };
}

export interface Photo {
  src: string;
  alt: string;
}

export interface ProductStyle {
  id: string;
  name: string;
  options?: { name: string; value: string }[];
  swatch?: string;
  photo?: Photo;
  priceCny?: number;
}

export interface Product {
  slug: string;
  name: string;
  color: string;
  category: Category;
  kind: ProductKind;
  priceCny: number;
  sellerId: string;
  listing: SourceListing;
  photo: Photo;
  styles: ProductStyle[];
  addedAt: string;
  featuredRank: number;
}

export interface QcImage extends Photo {
  id: string;
  groupId?: string;
  sourceAgent?: string;
  originalProductId?: string;
  skuId?: string;
  styleId?: string;
  productSlug?: string;
  view?: "front" | "construction" | "label" | "sole";
  capturedAt?: string;
}

export interface Collection {
  slug: string;
  title: string;
  description: string;
  ownerHandle: string;
  productSlugs: string[];
}

export interface Profile {
  handle: string;
  displayName: string;
  bio: string;
}

export type CatalogItem = Product & { seller: Seller; qcCount: number };
export const sorts = ["featured", "newest", "price-asc", "price-desc"] as const;
export type Sort = (typeof sorts)[number];
export interface CatalogQuery {
  query?: string;
  category?: Category;
  kind?: ProductKind;
  sellerId?: string;
  marketplace?: Marketplace;
  qcOnly?: boolean;
  sort?: Sort;
}
