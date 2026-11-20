import type { Marketplace, SourceListing } from "./types";

const rules = {
  "1688": { host: "detail.1688.com", path: "/offer/" },
  Weidian: { host: "weidian.com", path: "/item.html", param: "itemID" },
  Taobao: { host: "item.taobao.com", path: "/item.htm", param: "id" },
} as const;

export function listingUrl(marketplace: Marketplace, itemId: string): string {
  const rule = rules[marketplace];
  const id = encodeURIComponent(itemId);
  return "https://" + rule.host + rule.path + ("param" in rule ? "?" + rule.param + "=" + id : id + ".html");
}

export function looksLikeUrl(input: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|[\w-]+(?:\.[\w-]+)+(?::\d+)?(?:[/?#]|$))/i.test(input.trim());
}

function singleParam(url: URL, name: string): string | undefined {
  const values = url.searchParams.getAll(name);
  return values.length === 1 ? values[0] : undefined;
}

export function parseMarketplaceUrl(input: string): SourceListing | null {
  const value = input.trim();
  // Backslashes and ASCII whitespace should not be repaired by URL normalization.
  if (!value || value.length > 2048 || /[\x00-\x20\x7f\\]/.test(value)) return null;
  let url: URL;
  try {
    const absolute = value.startsWith("//") ? "https:" + value
      : /^[a-z][a-z\d+.-]*:/i.test(value) ? value : "https://" + value;
    if (!/^https?:\/\/[^/]/i.test(absolute)) return null;
    url = new URL(absolute);
  } catch {
    return null;
  }
  if (url.username || url.password || url.port) return null;

  const host = url.hostname;
  let marketplace: Marketplace;
  let id: string | undefined;
  if (host === "detail.1688.com" || host === "m.1688.com") {
    marketplace = "1688";
    id = /^\/offer\/(\d+)\.html\/?$/.exec(url.pathname)?.[1];
  } else if ((host === "weidian.com" || host === "www.weidian.com") && url.pathname === "/item.html") {
    marketplace = "Weidian";
    id = singleParam(url, "itemID");
  } else if ((host === "item.taobao.com" && url.pathname === "/item.htm")
    || (host === "h5.m.taobao.com" && url.pathname === "/awp/core/detail.htm")
    || (host === "m.intl.taobao.com" && url.pathname === "/detail/detail.html")) {
    marketplace = "Taobao";
    id = singleParam(url, "id");
  } else {
    return null;
  }

  return id && /^[1-9]\d{0,31}$/.test(id) ? { marketplace, itemId: id, url: listingUrl(marketplace, id) } : null;
}
