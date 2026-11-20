import type { Marketplace, QcImage, SourceListing } from "../../src/lib/catalog/types";
import type { LiveProduct, LookupErrorCode } from "../../src/lib/lookup/types";

export class ProviderError extends Error {
  constructor(readonly code: LookupErrorCode) {
    super(code);
    this.name = "ProviderError";
  }
}

export interface ProductProvider {
  marketplace: Marketplace;
  getProduct(listing: SourceListing, signal: AbortSignal): Promise<LiveProduct>;
}

/** Only register agents that authorize public display and caching of their QC records. */
export interface QcProvider {
  agent: string;
  supports(marketplace: Marketplace): boolean;
  getPhotos(listing: SourceListing, signal: AbortSignal): Promise<QcImage[]>;
}
