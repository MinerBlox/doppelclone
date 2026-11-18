import "server-only";
import { filterCatalog } from "./filter";
import { collections, products, profiles, qcImages, sellers } from "./mock";
import type { CatalogItem, CatalogQuery, Collection, Profile, QcImage } from "./types";

export interface CatalogService {
  search(query?: CatalogQuery): Promise<CatalogItem[]>;
  getProduct(slug: string): Promise<CatalogItem | null>;
  getQcImages(productSlug: string): Promise<QcImage[]>;
  listCollections(): Promise<Collection[]>;
  getProfile(handle: string): Promise<Profile | null>;
}

const items: CatalogItem[] = products.map((product) => {
  const seller = sellers.find(({ id }) => id === product.sellerId);
  if (!seller) throw new Error(`Missing seller for ${product.slug}`);
  return {
    ...product,
    seller,
    qcCount: qcImages.filter(({ productSlug }) => productSlug === product.slug).length,
  };
});

export const catalog: CatalogService = {
  async search(query) {
    return filterCatalog(items, query);
  },
  async getProduct(slug) {
    return items.find((item) => item.slug === slug) ?? null;
  },
  async getQcImages(slug) {
    return qcImages.filter((image) => image.productSlug === slug);
  },
  async listCollections() {
    return [...collections];
  },
  async getProfile(handle) {
    return profiles.find((profile) => profile.handle === handle) ?? null;
  },
};
