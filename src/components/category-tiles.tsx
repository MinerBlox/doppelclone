import Image from "next/image";
import { productKinds, type CatalogItem, type ProductKind } from "@/lib/catalog/types";
import { publicAsset } from "@/lib/utils";

export function CategoryTiles({ items, selected, onSelect }: {
  items: CatalogItem[];
  selected?: ProductKind;
  onSelect: (kind: ProductKind) => void;
}) {
  return (
    <div className="category-tiles" role="group" aria-label="Shop by category">
      {productKinds.map((kind) => {
        const item = items.find((product) => product.kind === kind);
        if (!item) return null;
        return <button key={kind} type="button" className="category-tile"
          aria-pressed={selected === kind} onClick={() => onSelect(kind)}>
          <span className="category-tile-image">
            <Image src={publicAsset(item.photo.src)} alt="" fill sizes="(max-width: 620px) 79px, 100px" />
          </span>
          <span>{kind}</span>
        </button>;
      })}
    </div>
  );
}
