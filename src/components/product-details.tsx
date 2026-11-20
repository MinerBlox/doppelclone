"use client";

import Image from "next/image";
import { ChevronDown, Clock3, MapPin, Star } from "lucide-react";
import { useId, useState } from "react";
import { AgentLinks } from "@/components/agent-links";
import { CurrencyPrice } from "@/components/currency-price";
import { ProductMedia, QcGallery } from "@/components/product-media";
import type { Photo, ProductStyle, QcImage, Seller, SourceListing } from "@/lib/catalog/types";
import type { ListingPrice, QcAvailability } from "@/lib/lookup/types";
import { publicAsset } from "@/lib/utils";

function matchesStyle(photo: QcImage, styleId: string) {
  return Boolean(styleId && (photo.styleId === styleId || photo.skuId === styleId));
}

function orderGroups(photos: QcImage[], styleId: string) {
  const byGroup = new Map<string, QcImage[]>();
  const matches = (photo: QcImage) => matchesStyle(photo, styleId);
  for (const photo of photos) {
    const key = JSON.stringify([photo.sourceAgent, photo.groupId, photo.groupId ? null : photo.id]);
    const group = byGroup.get(key) ?? [];
    group.push(photo);
    byGroup.set(key, group);
  }
  return Array.from(byGroup, ([id, group]) => {
    const matching = group.filter(matches);
    return {
      id,
      matchesStyle: matching.length > 0,
      photos: [...matching, ...group.filter((photo) => !matches(photo))],
    };
  }).sort((a, b) => Number(b.matchesStyle) - Number(a.matchesStyle));
}

interface DetailItem {
  listing: SourceListing;
  name: string;
  category?: string;
  priceCny?: number;
  price?: ListingPrice;
  seller?: Pick<Seller, "name" | "metrics"> & { city?: string };
  photo?: Photo;
  photos?: Photo[];
  styles: ProductStyle[];
}

export function ProductDetails({ item, photos, live }: {
  item: DetailItem;
  photos: QcImage[];
  live?: { provider: string; qcStatus: QcAvailability };
}) {
  const [styleId, setStyleId] = useState(item.styles[0]?.id ?? "");
  const [expanded, setExpanded] = useState(false);
  const styleList = useId();
  const style = item.styles.find(({ id }) => id === styleId);
  const groups = orderGroups(photos, styleId);
  const matchingCount = photos.filter((photo) => matchesStyle(photo, styleId)).length;
  const mainPhotos = [...new Map(
    [style?.photo, item.photo, ...(item.photos ?? []), ...groups.flatMap((group) => group.photos)]
      .filter((photo): photo is Photo => Boolean(photo)).map((photo) => [photo.src, photo]),
  ).values()];
  const seller = item.seller;
  const metrics = seller?.metrics;
  const price = style?.priceCny ?? item.price?.amountCny ?? item.priceCny;
  const qcLabel = live?.qcStatus === "unavailable" ? "No authorized QC feed is available for this listing."
    : photos.length === 0 ? "No QC photos yet" : !style ? `${photos.length} QC photos`
    : matchingCount ? `${matchingCount} for ${style.name} · ${photos.length} total`
    : `No QC photos for ${style.name} · Showing all ${photos.length}`;

  return (
    <>
      <div className="product-overview">
        <div className="product-media-with-caption">
          {mainPhotos.length > 0 ? <ProductMedia key={styleId} photos={mainPhotos} />
            : <div className="product-media-frame lookup-media-empty">The provider did not return product images.</div>}
          {style && !style.photo && mainPhotos.length > 0 && <p className="style-photo-note">No separate preview image for {style.name}.</p>}
        </div>
        <section className="product-detail" aria-labelledby="product-heading">
          <p className="eyebrow">{item.listing.marketplace}{item.category && <> <span aria-hidden="true">/</span> {item.category}</>}</p>
          <h1 id="product-heading">{item.name}</h1>
          {price !== undefined ? <CurrencyPrice amount={price} /> : <p className="style-photo-note">The provider did not return a price.</p>}
          {style?.priceCny === undefined && item.price?.basis === "quantity-tier" && <p className="style-photo-note">Unit price for {item.price.minQuantity}+ pieces.</p>}
          {style?.priceCny === undefined && item.price?.basis === "from" && <p className="style-photo-note">Starting SKU price. Minimum order may apply.</p>}
          {item.styles.length > 0 && <div className="style-picker">
            <button type="button" className="style-picker-trigger" aria-expanded={expanded} aria-controls={styleList}
              onClick={() => setExpanded((current) => !current)}>
              <strong>Style Options: {item.styles.length}</strong>
              <span>{style?.name}<ChevronDown size={16} aria-hidden="true" /></span>
            </button>
            <div id={styleList} className="style-option-list" role="group" aria-label="Available styles" hidden={!expanded}>
              {item.styles.map((option) => <button type="button" key={option.id} className="style-option"
                aria-pressed={option.id === styleId} onClick={() => setStyleId(option.id)}>
                {option.photo ? <span className="style-option-swatch">
                  <Image src={publicAsset(option.photo.src)} alt="" fill sizes="34px" referrerPolicy="no-referrer" />
                </span> : <span className="style-option-swatch" style={{ backgroundColor: option.swatch }} aria-hidden="true" />}
                <span>{option.name}{live?.qcStatus !== "unavailable" && <small>{photos.filter((photo) => matchesStyle(photo, option.id)).length} QC</small>}</span>
              </button>)}
            </div>
          </div>}
          {live ? <div className="agent-links">
            <a href={item.listing.url} target="_blank" rel="noopener noreferrer" className="agent-more lookup-original">View on {item.listing.marketplace}</a>
            <p className="style-photo-note">Listing data from {live.provider}.</p>
          </div> : <AgentLinks />}
          <section className="seller-summary" aria-labelledby="seller-heading">
            <div className="seller-summary-heading">
              <h2 id="seller-heading">{seller?.name ?? "Seller information unavailable"}</h2>
              {metrics?.sample && <span>Sample data</span>}
            </div>
            {(metrics || seller?.city) && <dl className="seller-metrics">
              {metrics && <>
                <div><dt><Clock3 size={14} aria-hidden="true" /> Avg. shipping time</dt>
                  <dd>{metrics.averageShippingDays.toFixed(1)} days</dd><dd className="seller-metric-detail">To a local warehouse</dd></div>
                <div><dt><Star size={14} aria-hidden="true" /> Avg. seller review</dt>
                  <dd>{metrics.averageRating.toFixed(1)} / 5</dd><dd className="seller-metric-detail">{metrics.reviewCount.toLocaleString("en-US")} reviews</dd></div>
              </>}
              {seller?.city && <div><dt><MapPin size={14} aria-hidden="true" /> Ships from</dt><dd>{seller.city}</dd></div>}
            </dl>}
          </section>
        </section>
      </div>

      <section id="product-qc" className="product-qc" aria-labelledby="product-qc-heading">
        <div className="qc-heading-row">
          <h2 id="product-qc-heading">QC photos</h2>
          <p role="status">{qcLabel}</p>
        </div>
        {photos.length > 0 ? <QcGallery key={styleId} groups={groups} productName={item.name} />
          : mainPhotos.length > 0 ? <p className="qc-empty">Check the product photo above for a closer look.</p> : null}
      </section>
    </>
  );
}
