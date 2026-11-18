"use client";

import Image from "next/image";
import { ArrowUpRight, Camera, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CatalogItem, QcImage } from "@/lib/catalog/types";

export function ProductCard({ item, qcImages, priority = false }: {
  item: CatalogItem;
  qcImages: QcImage[];
  priority?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const price = `¥${item.priceCny.toLocaleString("en")}`;
  useLayoutEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);

  return (
    <article className="product-card">
      <button ref={trigger} className="product-trigger" type="button" aria-haspopup="dialog"
        onClick={() => setOpen(true)}>
        <span className="product-image block">
          <Image src={item.photo.src} alt={item.photo.alt} fill preload={priority}
            sizes="(max-width: 620px) 46vw, (max-width: 920px) 31vw, (max-width: 1310px) 24vw, 290px" />
          <span className="preview-arrow"><ArrowUpRight size={16} aria-hidden="true" /></span>
        </span>
        <span className="product-meta">
          <span>{item.listing.marketplace}</span>
          {item.qcCount > 0 && <span><Camera size={13} aria-hidden="true" /> {item.qcCount} QC</span>}
        </span>
        <span className="product-title"><span>{item.name}</span><span>{price}</span></span>
        <span className="product-color block">{item.color}</span>
      </button>

      <dialog ref={dialog} aria-labelledby={titleId} className="product-dialog"
        onClose={() => { setOpen(false); trigger.current?.focus(); }}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        {open && <motion.div className="dialog-content"
          initial={reducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}>
          <Button variant="ghost" size="icon" className="dialog-close" aria-label="Close product preview"
            onClick={() => dialog.current?.close()}><X size={19} /></Button>
          <div className="dialog-lead">
            <Image src={item.photo.src} alt={item.photo.alt} width={540} height={540} sizes="(max-width: 620px) 85vw, 260px" />
            <div>
              <p className="eyebrow">{item.listing.marketplace} · {item.seller.city}</p>
              <h2 id={titleId}>{item.name}</h2>
              <p>{item.color} · {price}</p>
              <p className="dialog-seller">{item.seller.name}</p>
              <p className="sample-listing">Sample listing. Search {item.listing.marketplace} using this URL format.</p>
              <code className="listing-example">{item.listing.url}</code>
            </div>
          </div>
          <section className="dialog-qc" aria-label="Quality check photos">
            <h3>Quality check photos</h3>
            {qcImages.length ? (
              <>
                <p>Sample warehouse photos</p>
                <div className="dialog-gallery">
                  {qcImages.map((photo) => <figure key={photo.id}>
                    <a href={photo.src} target="_blank" rel="noreferrer" aria-label={`Open full-size ${photo.view} sample photo`}>
                      <Image src={photo.src} alt={photo.alt} width={540} height={540} sizes="(max-width: 620px) 42vw, 300px" />
                    </a>
                    <figcaption>{photo.view}</figcaption>
                  </figure>)}
                </div>
              </>
            ) : <p>No QC photos in the sample catalog for this item.</p>}
          </section>
        </motion.div>}
      </dialog>
    </article>
  );
}
