import type { Photo, ProductStyle, QcImage, SourceListing } from "../catalog/types";

export interface ListingPrice {
  amountCny: number;
  basis: "unit" | "quantity-tier" | "from";
  minQuantity?: number;
}

export interface ListingSeller {
  name: string;
  translatedName?: string;
  city?: string;
  averageShippingHours?: number;
  shopScore?: number;
}

export interface LiveProduct {
  listing: SourceListing;
  name: string;
  category?: string;
  price?: ListingPrice;
  seller?: ListingSeller;
  photos: Photo[];
  styles: ProductStyle[];
  provider: string;
  retrievedAt: string;
}

export type QcAvailability = "available" | "none" | "unavailable";
export type LookupErrorCode =
  | "invalid_url" | "not_configured" | "not_found"
  | "provider_unavailable" | "timeout" | "rate_limited";

export type LookupResponse =
  | { ok: true; product: LiveProduct; qc: { status: QcAvailability; photos: QcImage[] }; saved?: true }
  | { ok: false; code: LookupErrorCode; message: string };
