import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";
import { publicAsset } from "@/lib/utils";
import type { CatalogItem } from "@/lib/catalog/types";

export function ProductCard({ item, priority = false }: { item: CatalogItem; priority?: boolean }) {
  return (
    <article className="product-card">
      <Link className="product-trigger" href={`/products/${item.slug}/`}>
        <span className="product-image block">
          <Image src={publicAsset(item.photo.src)} alt={item.photo.alt} fill preload={priority}
            sizes="(max-width: 620px) 47vw, (max-width: 920px) 31vw, 300px" />
          <span className="preview-arrow"><ArrowUpRight size={16} aria-hidden="true" /></span>
        </span>
        <span className="product-meta">
          <span>{item.listing.marketplace}</span>
          {item.qcCount > 0 && <span><Camera size={13} aria-hidden="true" /> {item.qcCount} QC</span>}
        </span>
        <span className="product-title"><span>{item.name}</span><span>¥{item.priceCny}</span></span>
        <span className="product-color block">{item.color}</span>
      </Link>
    </article>
  );
}
