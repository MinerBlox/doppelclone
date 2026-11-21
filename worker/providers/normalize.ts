import type { Photo } from "../../src/lib/catalog/types";

export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, 300) || undefined : undefined;
}

export function money(value: unknown): number | undefined {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value.trim()))) return;
  const amount = Number(value);
  if (Number.isFinite(amount) && amount > 0) return amount;
}

export function photo(value: unknown, alt: string, domain = "alicdn.com"): Photo | undefined {
  if (typeof value !== "string" || value.length > 2048) return;
  try {
    const url = new URL(value.startsWith("//") ? "https:" + value : value);
    if (url.protocol !== "https:" || url.username || url.password || url.port
      || !(url.hostname === domain || url.hostname.endsWith("." + domain))) return;
    return { src: url.href, alt };
  } catch {
    return;
  }
}
