import type { Marketplace, SourceListing } from "./types";

const rules: Record<Marketplace, { host: string; path: string; param?: string }> = {
  "1688": { host: "detail.1688.com", path: "/offer/" },
  Weidian: { host: "weidian.com", path: "/item.html", param: "itemID" },
  Taobao: { host: "item.taobao.com", path: "/item.htm", param: "id" },
};

export function listingUrl(marketplace: Marketplace, itemId: string): string {
  const { host, path, param } = rules[marketplace];
  const id = encodeURIComponent(itemId);
  return `https://${host}${path}${param ? `?${param}=${id}` : `${id}.html`}`;
}

export function parseMarketplaceUrl(input: string): SourceListing | null {
  const value = input.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.username || url.password || url.port) return null;

  for (const [marketplace, rule] of Object.entries(rules) as [Marketplace, (typeof rules)[Marketplace]][]) {
    if (url.hostname.replace(/^www\./, "") !== rule.host) continue;
    const id = rule.param
      ? (url.pathname === rule.path ? url.searchParams.get(rule.param) : null)
      : (/^\/offer\/(\d+)\.html\/?$/.exec(url.pathname)?.[1]);
    if (id && /^\d+$/.test(id)) {
      return { marketplace, itemId: id, url: listingUrl(marketplace, id) };
    }
  }
  return null;
}
