import type { Photo, ProductStyle, SourceListing } from "../../src/lib/catalog/types";
import type { ListingPrice, LiveProduct } from "../../src/lib/lookup/types";
import { getProviderJson, type Fetch } from "./http";
import { array, money, photo, record, text } from "./normalize";
import { ProviderError, type ProductProvider } from "./types";

const endpoint = "https://gateway.litbuy.com/unified-service/catalog-service/profile";

function positiveQuantity(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
}

function listingPrice(data: Record<string, unknown>): ListingPrice | undefined {
  const tiers = array(record(data.saleInfo).priceRangeList).map(record).flatMap((tier) => {
    const amount = money(tier.priceCNY);
    const quantity = positiveQuantity(tier.startQuantity);
    return amount !== undefined && quantity !== undefined ? [{ amount, quantity }] : [];
  }).sort((a, b) => a.quantity - b.quantity);
  const minQuantity = tiers[0]?.quantity ?? positiveQuantity(data.startQuantity);
  const amountCny = tiers[0]?.amount ?? money(data.priceCNY);
  if (amountCny === undefined) return;
  if (minQuantity === undefined) return { amountCny, basis: "from" };
  return minQuantity > 1 ? { amountCny, basis: "quantity-tier", minQuantity } : { amountCny, basis: "unit" };
}

function listingStyles(data: Record<string, unknown>, listing: SourceListing, price?: ListingPrice): ProductStyle[] {
  const styles = new Map<string, ProductStyle>();
  for (const sku of array(data.skuVoList).slice(0, 500).map(record)) {
    const id = sku.skuNo;
    if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(id) || styles.has(id)) continue;
    if ((sku.spuNo !== undefined && sku.spuNo !== listing.itemId)
      || (sku.channel !== undefined && sku.channel !== listing.marketplace)) continue;
    const attributes = array(sku.skuAttr).slice(0, 20).map(record);
    const name = attributes.map(({ enumValue }) => text(enumValue)).filter(Boolean).join(" / ") || "SKU " + id;
    const image = attributes.map(({ enumImageUrl }) => photo(enumImageUrl, name)).find(Boolean);
    // Only replace the listing price when the sample identifies it as a single-piece offer.
    styles.set(id, { id, name, photo: image, priceCny: price?.basis === "unit" ? money(sku.priceCNY) : undefined });
  }
  return [...styles.values()];
}

export function normalizeLitBuy(payload: unknown, listing: SourceListing, now: Date): LiveProduct {
  const envelope = record(payload);
  if (envelope.code === 404) throw new ProviderError("not_found");
  if (envelope.code === 429) throw new ProviderError("rate_limited");
  if (envelope.success !== true || envelope.code !== 200) throw new ProviderError("provider_unavailable");
  if (envelope.result === null) throw new ProviderError("not_found");

  const data = record(envelope.result);
  const name = text(data.subject);
  if (!name || data.spuNo !== listing.itemId || data.channel !== listing.marketplace) {
    throw new ProviderError("provider_unavailable");
  }
  if (data.productProhibitedFromSale === true) throw new ProviderError("not_found");

  const photos = new Map<string, Photo>();
  for (const url of [data.mainImg, ...array(data.imageList).slice(0, 30)]) {
    const image = photo(url, name);
    if (image) photos.set(image.src, image);
    if (photos.size >= 30) break;
  }
  const price = listingPrice(data);
  const sellerName = text(data.shopName);
  return {
    listing,
    name,
    price,
    seller: sellerName ? { name: sellerName } : undefined,
    photos: [...photos.values()],
    styles: listingStyles(data, listing, price),
    provider: "LitBuy",
    retrievedAt: now.toISOString(),
  };
}

export function createLitBuy1688Provider(fetcher: Fetch): ProductProvider {
  return {
    marketplace: "1688",
    async getProduct(listing, signal) {
      const url = new URL(endpoint);
      url.search = new URLSearchParams({
        channel: "1688", refresh: "0", spuNo: listing.itemId, activityCode: "", linkSearch: "true",
      }).toString();
      const request = new Request(url, { headers: { Accept: "application/json" } });
      return normalizeLitBuy(await getProviderJson(request, signal, fetcher), listing, new Date());
    },
  };
}
