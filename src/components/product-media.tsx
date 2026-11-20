"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Photo, QcImage } from "@/lib/catalog/types";
import { publicAsset } from "@/lib/utils";

type Group = { id: string; photos: QcImage[]; matchesStyle?: boolean };
type Viewer = { group: Group; index: number };

const views: Record<QcImage["view"], string> = {
  front: "Overview", construction: "Construction", label: "Label", sole: "Outsole",
};

function wrap(index: number, count: number) {
  return (index + count) % count;
}

export function ProductMedia({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0);
  const active = photos[index];
  function move(offset: number) {
    setIndex((current) => wrap(current + offset, photos.length));
  }

  return (
    <div className="product-media" role="group" aria-label="Product photos"
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }}>
      <div className="product-media-frame">
        <Image src={publicAsset(active.src)} alt={active.alt} fill preload={index === 0}
          sizes="(max-width: 740px) 100vw, 570px" />
        {photos.length > 1 && <>
          <button className="media-arrow media-arrow-prev" type="button" aria-label="Previous product photo" onClick={() => move(-1)}><ChevronLeft size={21} /></button>
          <button className="media-arrow media-arrow-next" type="button" aria-label="Next product photo" onClick={() => move(1)}><ChevronRight size={21} /></button>
          <span className="media-counter" aria-live="polite">{index + 1} / {photos.length}</span>
        </>}
      </div>
      {photos.length > 1 && <div className="product-thumbs">
        {photos.map((photo, photoIndex) => <button key={photo.src} type="button"
          aria-label={photoIndex === 0 ? "Show listing photo" : `Show product photo ${photoIndex + 1}`}
          aria-pressed={index === photoIndex} onClick={() => setIndex(photoIndex)}>
          <Image src={publicAsset(photo.src)} alt="" width={64} height={64} />
        </button>)}
      </div>}
    </div>
  );
}

function useAutoScroll(rail: RefObject<HTMLDivElement | null>, cycle: RefObject<HTMLDivElement | null>, playing: boolean) {
  useEffect(() => {
    if (!playing) return;
    const element = rail.current;
    const first = cycle.current;
    if (!element || !first) return;

    let frame = 0;
    let lastTime = 0;
    let remainder = 0;
    function tick(now: number) {
      if (!element || !first) return;
      if (lastTime) {
        remainder += Math.min(now - lastTime, 40) * 0.029;
        const pixels = Math.floor(remainder);
        remainder -= pixels;
        if (pixels) {
          const length = first.getBoundingClientRect().width;
          const next = element.scrollLeft + pixels;
          element.scrollLeft = length && next >= length * 2 ? next - length : next;
        }
      }
      lastTime = now;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [rail, cycle, playing]);
}

export function QcGallery({ groups, productName }: { groups: Group[]; productName: string }) {
  const tiles = groups.flatMap((group) => group.photos.map((photo, index) => ({ group, photo, index })));
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const cycle = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const restoringFocus = useRef(false);
  const canLoop = tiles.length > 1;

  useAutoScroll(rail, cycle, canLoop && !reducedMotion && !paused && !hover && !focused && !touching && !viewer);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  function releaseTouch() {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setTouching(false), 750);
  }

  const viewerOpen = viewer !== null;
  useEffect(() => {
    if (viewerOpen && !dialog.current?.open) dialog.current?.showModal();
  }, [viewerOpen]);

  function scroll(direction: number) {
    const element = rail.current;
    const first = cycle.current;
    if (!element || !first) return;
    const width = first.getBoundingClientRect().width;
    const tileWidth = width / tiles.length;
    if (direction < 0 && element.scrollLeft < tileWidth) element.scrollLeft += width;
    if (direction > 0 && element.scrollLeft >= width * 2) element.scrollLeft -= width;
    element.scrollBy({ left: tileWidth * direction, behavior: reducedMotion ? "instant" : "smooth" });
  }

  function moveViewer(direction: number) {
    setViewer((current) => current && ({
      ...current, index: wrap(current.index + direction, current.group.photos.length),
    }));
  }

  const selected = viewer?.group.photos[viewer.index];
  return (
    <div className="qc-gallery">
      {canLoop && <div className="qc-controls" role="group" aria-label="QC carousel controls">
        <button type="button" className="gallery-control" aria-label="Previous QC photo" onClick={() => scroll(-1)}><ChevronLeft size={18} /></button>
        {!reducedMotion && <button type="button" className="gallery-control" aria-label={paused ? "Play QC slideshow" : "Pause QC slideshow"}
          onClick={() => setPaused(!paused)}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
        <button type="button" className="gallery-control" aria-label="Next QC photo" onClick={() => scroll(1)}><ChevronRight size={18} /></button>
      </div>}
      <div ref={rail} className={canLoop ? "qc-rail" : "qc-rail qc-rail-single"}
        onPointerLeave={() => setHover(false)}
        onFocus={(event) => setFocused(!restoringFocus.current && event.target.matches(":focus-visible"))}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
        onPointerDown={(event) => {
          setFocused(false);
          if (event.pointerType !== "mouse") {
            setTouching(true);
            releaseTouch();
          }
        }}
        onPointerUp={(event) => { if (event.pointerType !== "mouse") releaseTouch(); }}
        onPointerCancel={releaseTouch}
        onScroll={() => { if (touching) releaseTouch(); }}>
        {Array.from({ length: canLoop ? 5 : 1 }, (_, copy) => (
          <div className="qc-cycle" ref={copy === 0 ? cycle : undefined} key={copy} aria-hidden={copy ? true : undefined}>
            {tiles.map(({ group, photo, index }) => (
              <button className="qc-tile" type="button" key={photo.id} tabIndex={copy ? -1 : undefined}
                aria-label={`Enlarge ${views[photo.view].toLowerCase()} photo and browse its QC group`}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setHover(false);
                  setFocused(false);
                  setViewer({ group, index });
                }}>
                <span className="qc-tile-image"
                  onPointerEnter={(event) => { if (event.pointerType === "mouse") setHover(true); }}
                  onPointerLeave={() => setHover(false)}>
                  <Image src={publicAsset(photo.src)} alt={photo.alt} fill sizes="(max-width: 620px) 68vw, 310px" />
                  <span className="qc-enlarge"><Maximize2 size={15} aria-hidden="true" /></span>
                </span>
                <span className="qc-tile-label">{views[photo.view]} <span>{group.matchesStyle ? "Selected style" : `${group.photos.length} in group`}</span></span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <dialog className="qc-viewer" ref={dialog} aria-labelledby="qc-viewer-title"
        onClose={() => {
          restoringFocus.current = true;
          opener.current?.focus({ preventScroll: true });
          restoringFocus.current = false;
          setHover(Boolean(rail.current?.querySelector(".qc-tile-image:hover")));
          setFocused(false);
          setViewer(null);
        }}
        onClick={(event) => { if (event.currentTarget === event.target) dialog.current?.close(); }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          moveViewer(event.key === "ArrowLeft" ? -1 : 1);
        }}>
        {viewer && selected && <div className="qc-viewer-content">
          <div className="qc-viewer-header">
            <div><h3 id="qc-viewer-title">QC photo group</h3>
              <p>{productName}</p></div>
            <button type="button" className="gallery-control" aria-label="Close QC photos" onClick={() => dialog.current?.close()}><X size={21} /></button>
          </div>
          <div className="qc-viewer-layout">
            <div className="qc-viewer-stage">
              <div className="qc-viewer-image">
                <Image src={publicAsset(selected.src)} alt={selected.alt} fill sizes="(max-width: 740px) 100vw, 690px" />
              </div>
              <div className="qc-viewer-footer">
                <p className="qc-viewer-caption" aria-live="polite"><strong>{views[selected.view]}</strong><span>{viewer.index + 1} of {viewer.group.photos.length}</span></p>
                {viewer.group.photos.length > 1 && <div className="qc-viewer-navigation">
                  <button className="gallery-control" type="button" aria-label="Previous photo in group" onClick={() => moveViewer(-1)}><ChevronLeft size={18} /></button>
                  <button className="gallery-control" type="button" aria-label="Next photo in group" onClick={() => moveViewer(1)}><ChevronRight size={18} /></button>
                </div>}
              </div>
            </div>
            <div className="qc-viewer-thumbs" role="group" aria-label="Photos in this QC group">
              {viewer.group.photos.map((photo, index) => <button key={photo.id} type="button" aria-label={`Show ${views[photo.view].toLowerCase()} photo`}
                aria-pressed={viewer.index === index} onClick={() => setViewer({ ...viewer, index })}>
                <Image src={publicAsset(photo.src)} alt="" width={60} height={60} />
                <span>{views[photo.view]}<small>{index + 1} / {viewer.group.photos.length}</small></span>
              </button>)}
            </div>
          </div>
        </div>}
      </dialog>
    </div>
  );
}
