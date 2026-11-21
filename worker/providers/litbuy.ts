import { parseMarketplaceUrl } from "../../src/lib/catalog/marketplace";
import type { Marketplace, Photo, ProductStyle, SourceListing } from "../../src/lib/catalog/types";
import type { ListingPrice, LiveProduct } from "../../src/lib/lookup/types";
import { getProviderJson, type Fetch } from "./http";
import { array, money, photo, record, text } from "./normalize";
import { ProviderError, type ProductProvider } from "./types";

const endpoint = "https://gateway.litbuy.com/unified-service/catalog-service/profile";
const channels = { "1688": "1688", Weidian: "weidian", Taobao: "TAOBAO" } as const satisfies Record<Marketplace, string>;

function matchesChannel(channel: unknown, marketplace: Marketplace) {
  return typeof channel === "string" && channel.toUpperCase() === channels[marketplace].toUpperCase();
}

function matchesOffer(data: Record<string, unknown>, listing: SourceListing) {
  if (data.spuNo === listing.itemId) return true;
  if (listing.marketplace !== "Taobao" || typeof data.spuNo !== "string" || !/^[\w-]{12,128}$/.test(data.spuNo)
    || /^\d+$/.test(data.spuNo) || typeof data.detailUrl !== "string") return false;
  // The response can identify the requested Taobao listing with an opaque mi_id.
  const directLink = parseMarketplaceUrl(data.detailUrl);
  if (directLink) return directLink.url === listing.url;
  try {
    const url = new URL(data.detailUrl);
    const ids = url.searchParams.getAll("id");
    const mapped = url.searchParams.getAll("mi_id");
    return url.origin === "https://item.taobao.com" && !url.username && !url.password && url.pathname === "/item.htm"
      && ids.length === 1 && ids[0] === "" && mapped.length === 1 && mapped[0] === data.spuNo;
  } catch {
    return false;
  }
}

function listingPhoto(value: unknown, alt: string, marketplace: Marketplace) {
  return photo(value, alt, marketplace === "Weidian" ? "geilicdn.com" : "alicdn.com");
}

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
    if ((sku.spuNo !== undefined && sku.spuNo !== data.spuNo)
      || (sku.channel !== undefined && !matchesChannel(sku.channel, listing.marketplace))) continue;
    const attributes = array(sku.skuAttr).slice(0, 20).map(record);
    const options = attributes.flatMap((attribute) => {
      const name = text(attribute.name);
      const value = text(attribute.enumValue);
      return name && value ? [{ name, value }] : [];
    });
    const name = attributes.map(({ enumValue }) => text(enumValue)).filter(Boolean).join(" / ") || "SKU " + id;
    const image = attributes.map(({ enumImageUrl }) => listingPhoto(enumImageUrl, name, listing.marketplace)).find(Boolean);
    // Only replace the listing price when the sample identifies it as a single-piece offer.
    styles.set(id, { id, name, options, photo: image, priceCny: price?.basis === "unit" ? money(sku.priceCNY) : undefined });
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
  if (!name || !matchesChannel(data.channel, listing.marketplace) || !matchesOffer(data, listing)) {
    throw new ProviderError("provider_unavailable");
  }
  if (data.productProhibitedFromSale === true) throw new ProviderError("not_found");

  const photos = new Map<string, Photo>();
  for (const url of [data.mainImg, ...array(data.imageList).slice(0, 30)]) {
    const image = listingPhoto(url, name, listing.marketplace);
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

export function createLitBuyProvider(marketplace: Marketplace, fetcher: Fetch): ProductProvider {
  return {
    marketplace,
    async getProduct(listing, signal) {
      const url = new URL(endpoint);
      url.search = new URLSearchParams({
        channel: channels[marketplace], refresh: "0", spuNo: listing.itemId, activityCode: "", linkSearch: "true",
      }).toString();
      const request = new Request(url, { headers: { Accept: "application/json" } });
      return normalizeLitBuy(await getProviderJson(request, signal, fetcher), listing, new Date());
    },
  };
}
