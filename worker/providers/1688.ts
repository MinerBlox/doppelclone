import type { Photo, ProductStyle, SourceListing } from "../../src/lib/catalog/types";
import type { ListingPrice, LiveProduct } from "../../src/lib/lookup/types";
import { getProviderJson, type Fetch } from "./http";
import { ProviderError, type ProductProvider } from "./types";

const endpoint = "https://api.nexscope.ai/alibaba1688/productDetail";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, 300) || undefined : undefined;
}

function id(value: unknown): string | undefined {
  const string = typeof value === "number" && Number.isSafeInteger(value) ? String(value) : value;
  return typeof string === "string" && /^[1-9]\d{0,31}$/.test(string) ? string : undefined;
}

function money(value: unknown): number | undefined {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value.trim()))) return;
  const amount = Number(value);
  if (Number.isFinite(amount) && amount > 0) return amount;
}

function photo(value: unknown, alt: string): Photo | undefined {
  if (typeof value !== "string" || value.length > 2048) return;
  try {
    const url = new URL(value.startsWith("//") ? "https:" + value : value);
    if (url.protocol !== "https:" || url.username || url.password || url.port
      || !(url.hostname === "alicdn.com" || url.hostname.endsWith(".alicdn.com"))) return;
    return { src: url.href, alt };
  } catch {
    return;
  }
}

function getStyles(skus: Record<string, unknown>[]): ProductStyle[] {
  const styles = new Map<string, ProductStyle>();
  for (const sku of skus) {
    const skuId = id(sku.skuId);
    if (!skuId || styles.has(skuId)) continue;
    const attributes = array(sku.attributes).map(record);
    const name = attributes.map((attribute) => text(attribute.valueTrans) ?? text(attribute.value)).filter(Boolean).join(" / ")
      || "SKU " + skuId;
    const image = attributes.map((attribute) => photo(attribute.skuImageUrl, name)).find(Boolean);
    styles.set(skuId, { id: skuId, name, photo: image, priceCny: money(sku.retailPrice) });
  }
  return [...styles.values()];
}

function getPrice(sale: Record<string, unknown>, skus: Record<string, unknown>[]): ListingPrice | undefined {
  const retail = money(sale.retailPrice);
  if (retail !== undefined) return { amountCny: retail, basis: "unit" };

  const tiers = array(sale.priceRanges).map(record).flatMap((tier) => {
    const price = money(tier.price);
    const quantity = tier.startQuantity;
    return price !== undefined && typeof quantity === "number" && Number.isSafeInteger(quantity) && quantity > 0
      ? [{ price, quantity }] : [];
  }).sort((a, b) => a.quantity - b.quantity);
  if (tiers[0]) return { amountCny: tiers[0].price, basis: "quantity-tier", minQuantity: tiers[0].quantity };

  // SKU retail prices represent one piece. Other SKU prices can be wholesale.
  const skuRetail = skus.map((sku) => money(sku.retailPrice)).filter((price): price is number => price !== undefined);
  const prices = skuRetail.length ? skuRetail
    : skus.map((sku) => money(sku.price)).filter((price): price is number => price !== undefined);
  return prices.length ? { amountCny: Math.min(...prices), basis: "from" } : undefined;
}

export function normalize1688(payload: unknown, listing: SourceListing, now: Date): LiveProduct {
  const envelope = record(payload);
  if (envelope.code !== 0) throw new ProviderError("provider_unavailable");
  if (envelope.data === null) throw new ProviderError("not_found");
  const data = record(envelope.data);
  const name = text(data.subjectTrans) ?? text(data.subject);
  if (!name || (data.offerId !== undefined && id(data.offerId) !== listing.itemId)) {
    throw new ProviderError("provider_unavailable");
  }

  const images = record(data.productImage);
  const photos = new Map<string, Photo>();
  for (const url of [...array(images.images), images.whiteImage, ...array(record(data.productImageTrans).images)]) {
    const image = photo(url, name);
    if (image) photos.set(image.src, image);
    if (photos.size >= 30) break;
  }
  const skus = array(data.skuList).slice(0, 500).map(record);
  const sellerName = text(data.companyName);
  return {
    listing,
    name,
    category: text(data.categoryName),
    price: getPrice(record(data.saleInfo), skus),
    seller: sellerName ? { name: sellerName, city: text(record(data.shippingInfo).sendGoodsAddressText) } : undefined,
    photos: [...photos.values()],
    styles: getStyles(skus),
    provider: "Nexscope",
    retrievedAt: now.toISOString(),
  };
}

export function create1688Provider(key: string, fetcher: Fetch): ProductProvider {
  return {
    marketplace: "1688",
    async getProduct(listing, signal) {
      const request = new Request(endpoint, {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ offerId: listing.itemId, currency: "CNY" }),
      });
      return normalize1688(await getProviderJson(request, signal, fetcher), listing, new Date());
    },
  };
}
