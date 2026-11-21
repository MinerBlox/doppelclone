import type { SourceListing } from "../catalog/types";
import { savedMarketplaceProducts } from "./saved-marketplaces";
import type { LookupResponse } from "./types";

// Listing fields from the supplied LitBuy response for this exact offer.
const itemId = "746801458197";
const name = "Old Money Style Straight Shoulder 21Am Knit Sweater Round Neck Pullover Loose Sweater Unisex Couple Style Simple";
const photos = [
  "https://cbu01.alicdn.com/img/ibank/O1CN01sgsirx1OYtKg5UjxM_!!1004951718-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01YqIiTQ1OYtZXAyA9H_!!1004951718-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01Ldm5AA1OYtZXAvwsM_!!1004951718-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01giwCHz1OYtZc6fZv4_!!1004951718-0-cib.jpg"
];
const variantPhotos = [
  "https://cbu01.alicdn.com/img/ibank/O1CN01yYEy7j1OYtRQj0UZd_!!1004951718-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01ro8cs61OYtaUpwmPw_!!1004951718-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01EpwbHH1OYtayJ1A04_!!1004951718-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01LKC8JZ1OYtayk4IDM_!!1004951718-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01mZ1q4d1OYtSN9siaC_!!1004951718-0-cib.jpg",
  "https://cbu01.alicdn.com/img/ibank/O1CN01NKoUFz1OYtayODc8i_!!1004951718-0-cib.jpg"
];
const variants: [id: string, colour: string, size: string, photo: number][] = [
  ["9530fe59de760ff8676a48417ebcb7bf","Dark gray","Q. 55-65kg",0],
  ["2c18c38870f24f1feaa64e8cb32ff7cf","Dark gray","Mr. 65-76kg",0],
  ["500b9c0399f71e3fd09420621cd3f136","Dark gray","L. 77.5-86.5kg",0],
  ["21244f7f5bc6e90a0597421265f3b8a4","Dark gray","Xl. 87.5-100kg",0],
  ["aec4be07b97719fca84f05498ffc2735","Dark gray","Xxl. 100kg and above",0],
  ["7909391a99ef90021cc2f8824c1d6aa4","Light gray","Q. 55-65kg",1],
  ["0534bf315b2c6ee6871899dcc4ff4c84","Light gray","Mr. 65-76kg",1],
  ["f967219a869ab2854b151064cf57604a","Light gray","L. 77.5-86.5kg",1],
  ["87d4c64648b8c068bf55b6063a648eaa","Light gray","Xl. 87.5-100kg",1],
  ["adb2cb5022939df5bcd746a635107e31","Light gray","Xxl. 100kg and above",1],
  ["b950d7998591d23ccef999d32aab6fd0","Black","Q. 55-65kg",2],
  ["3a220a602b409eb72689184f5bbe24f2","Black","Mr. 65-76kg",2],
  ["4b2f3458885bfc7ba065e1a386c90672","Black","L. 77.5-86.5kg",2],
  ["ce29144fafa9849b9577dd18e5778bd5","Black","Xl. 87.5-100kg",2],
  ["a62fb76e469bc62894970f7d0b84d51b","Black","Xxl. 100kg and above",2],
  ["0fcd8752773ed552ed42b00bd29f7b2a","Navy blue","Q. 55-65kg",3],
  ["5e952977b90aecc719f8ff14df2f0341","Navy blue","Mr. 65-76kg",3],
  ["0281c3c94b50f04985586816e5fd0c13","Navy blue","L. 77.5-86.5kg",3],
  ["c90063a3d4fb5ac0c22e96346eeedb60","Navy blue","Xl. 87.5-100kg",3],
  ["ceed4a7c25146a48b87afb0e14cc3f20","Navy blue","Xxl. 100kg and above",3],
  ["204189aaed1dfe81e30698ee8c5df3c9","Apricot","Q. 55-65kg",4],
  ["111a559a157aec779a352789887c79b5","Apricot","Mr. 65-76kg",4],
  ["554e8d805feae630937c5a4dfa1cb6ef","Apricot","L. 77.5-86.5kg",4],
  ["28d57eea0196b89405f4d341d79e1485","Apricot","Xl. 87.5-100kg",4],
  ["91f55bc6b0e8415826fe844c9ba60de4","Apricot","Xxl. 100kg and above",4],
  ["a2ad3c922b68a53933d53f42d5e68aee","Wine red","Q. 55-65kg",5],
  ["b8835b0c5a3feb90eb6ea1a4e2c86289","Wine red","Mr. 65-76kg",5],
  ["a0d779876418b30cfef2a6f5538fec9a","Wine red","L. 77.5-86.5kg",5],
  ["c11b158f2c33f73a7dbac81e83517119","Wine red","Xl. 87.5-100kg",5],
  ["f202ed147f9c52583f496e3cf7e9cddf","Wine red","Xxl. 100kg and above",5],
];

export function savedListing(listing: SourceListing): Extract<LookupResponse, { ok: true }> | undefined {
  if (listing.marketplace !== "1688" || listing.itemId !== itemId) {
    const product = savedMarketplaceProducts.find((candidate) => candidate.listing.url === listing.url);
    if (product) return { ok: true, saved: true, product, qc: { status: "unavailable", photos: [] } };
    return;
  }
  return {
    ok: true,
    saved: true,
    product: {
      listing,
      name,
      price: { amountCny: 88, basis: "unit" },
      seller: {
        name: "汕尾德利毛织厂",
        translatedName: "Shanwei Deli Knitwear Factory",
        averageShippingHours: 15.88,
        shopScore: 4,
      },
      photos: photos.map((src) => ({ src, alt: name })),
      styles: variants.map(([id, colour, size, index]) => {
        const name = colour + " / " + size;
        return {
          id, name,
          options: [{ name: "Colour", value: colour }, { name: "Size", value: size }],
          photo: index >= 0 ? { src: variantPhotos[index], alt: name } : undefined,
        };
      }),
      provider: "LitBuy",
      retrievedAt: "2026-11-21T15:36:19.745Z",
    },
    qc: { status: "unavailable", photos: [] },
  };
}
