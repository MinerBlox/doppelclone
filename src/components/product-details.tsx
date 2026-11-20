"use client";

import Image from "next/image";
import { ChevronDown, Clock3, MapPin, Star } from "lucide-react";
import { useId, useState } from "react";
import { AgentLinks } from "@/components/agent-links";
import { CurrencyPrice } from "@/components/currency-price";
import { ProductMedia, QcGallery } from "@/components/product-media";
import type { CatalogItem, QcImage } from "@/lib/catalog/types";
import { publicAsset } from "@/lib/utils";

function orderGroups(photos: QcImage[], styleId: string) {
  const byGroup = new Map<string, QcImage[]>();
  const matches = (photo: QcImage) => photo.styleId === styleId;
  for (const photo of photos) {
    const group = byGroup.get(photo.groupId) ?? [];
    group.push(photo);
    byGroup.set(photo.groupId, group);
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

export function ProductDetails({ item, photos }: { item: CatalogItem; photos: QcImage[] }) {
  const [styleId, setStyleId] = useState(item.styles[0]?.id ?? "");
  const [expanded, setExpanded] = useState(false);
  const styleList = useId();
  const style = item.styles.find(({ id }) => id === styleId);
  const groups = orderGroups(photos, styleId);
  const matchingCount = photos.filter((photo) => photo.styleId === styleId).length;
  const mainPhotos = [style?.photo ?? item.photo, ...groups.flatMap((group) => group.photos)];
  const metrics = item.seller.metrics;

  return (
    <>
      <div className="product-overview">
        <div className="product-media-with-caption">
          <ProductMedia key={styleId} photos={mainPhotos} />
          {style && !style.photo && <p className="style-photo-note">Showing the original listing photo. {style.name} has no preview image yet.</p>}
        </div>
        <section className="product-detail" aria-labelledby="product-heading">
          <p className="eyebrow">{item.listing.marketplace} <span aria-hidden="true">/</span> {item.category}</p>
          <h1 id="product-heading">{item.name}</h1>
          <CurrencyPrice amount={item.priceCny} />
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
                  <Image src={publicAsset(option.photo.src)} alt="" fill sizes="34px" />
                </span> : <span className="style-option-swatch" style={{ backgroundColor: option.swatch }} aria-hidden="true" />}
                <span>{option.name}<small>{photos.filter((photo) => photo.styleId === option.id).length} QC</small></span>
              </button>)}
            </div>
          </div>}
          <AgentLinks />
          <section className="seller-summary" aria-labelledby="seller-heading">
            <div className="seller-summary-heading">
              <h2 id="seller-heading">{item.seller.name}</h2>
              {metrics?.sample && <span>Sample data</span>}
            </div>
            <dl className="seller-metrics">
              {metrics && <>
                <div><dt><Clock3 size={14} aria-hidden="true" /> Avg. shipping time</dt>
                  <dd>{metrics.averageShippingDays.toFixed(1)} days</dd><dd className="seller-metric-detail">To a local warehouse</dd></div>
                <div><dt><Star size={14} aria-hidden="true" /> Avg. seller review</dt>
                  <dd>{metrics.averageRating.toFixed(1)} / 5</dd><dd className="seller-metric-detail">{metrics.reviewCount.toLocaleString("en-US")} reviews</dd></div>
              </>}
              <div><dt><MapPin size={14} aria-hidden="true" /> Ships from</dt><dd>{item.seller.city}</dd></div>
            </dl>
          </section>
        </section>
      </div>

      <section id="product-qc" className="product-qc" aria-labelledby="product-qc-heading">
        <div className="qc-heading-row">
          <h2 id="product-qc-heading">QC photos</h2>
          <p role="status">{photos.length === 0 ? "No QC photos yet" : matchingCount
            ? `${matchingCount} for ${style?.name ?? "this style"} · ${photos.length} total`
            : `No QC photos for ${style?.name ?? "this style"} · Showing all ${photos.length}`}</p>
        </div>
        {photos.length > 0 ? <QcGallery key={styleId} groups={groups} productName={item.name} />
          : <p className="qc-empty">Check the product photo above for a closer look.</p>}
      </section>
    </>
  );
}
