import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ScanLine } from "lucide-react";
import { ProductMedia, QcGallery } from "@/components/product-media";
import { AgentLinks } from "@/components/agent-links";
import { catalog } from "@/lib/catalog/service";
import type { QcImage } from "@/lib/catalog/types";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await catalog.search()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await catalog.getProduct((await params).slug);
  return item ? { title: `${item.name} | FindThat`, description: item.photo.alt } : {};
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const item = await catalog.getProduct(slug);
  if (!item) notFound();

  const photos = await catalog.getQcImages(slug);
  const photosByGroup = new Map<string, QcImage[]>();
  for (const photo of photos) {
    const group = photosByGroup.get(photo.groupId) ?? [];
    group.push(photo);
    photosByGroup.set(photo.groupId, group);
  }
  const groups = Array.from(photosByGroup, ([id, photos]) => ({ id, photos }));
  const titlePhotos = [item.photo, ...photos];
  const price = new Intl.NumberFormat("en", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(item.priceCny);

  return (
    <main className="shell product-page" id="main">
      <Link className="product-back" href="/#discover"><ArrowLeft size={16} aria-hidden="true" /> Discover</Link>
      <div className="product-overview">
        <ProductMedia photos={titlePhotos} />
        <section className="product-detail" aria-labelledby="product-heading">
          <p className="eyebrow">{item.listing.marketplace} <span aria-hidden="true">/</span> {item.category}</p>
          <h1 id="product-heading">{item.name}</h1>
          <p className="detail-price">{price}</p>
          <dl className="product-facts">
            <div><dt>Colour</dt><dd>{item.color}</dd></div>
            <div><dt>Seller</dt><dd>{item.seller.name}</dd></div>
            <div><dt>Ships from</dt><dd>{item.seller.city}</dd></div>
          </dl>
          <AgentLinks />
          {photos.length > 0 && <a className="detail-qc-link" href="#product-qc">
            <ScanLine size={17} aria-hidden="true" /> Browse {photos.length} QC photos
          </a>}
          <p className="sample-note">Sample listing from the FindThat preview catalog.</p>
        </section>
      </div>

      <section id="product-qc" className="product-qc" aria-labelledby="product-qc-heading">
        <div className="qc-heading-row">
          <h2 id="product-qc-heading">QC photos</h2>
          <p>{photos.length ? `${photos.length} sample warehouse photos` : "No QC photos yet"}</p>
        </div>
        {photos.length > 0 ? <QcGallery groups={groups} /> : <p className="qc-empty">Check the product photo above for a closer look.</p>}
      </section>
    </main>
  );
}
