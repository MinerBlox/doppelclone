"use client";

import { useEffect, useState } from "react";
import { FilterSelect } from "@/components/discovery-controls";

const currencies = {
  USD: { label: "US dollar", locale: "en-US" },
  GBP: { label: "British pound", locale: "en-GB" },
  EUR: { label: "Euro", locale: "en-IE" },
  CAD: { label: "Canadian dollar", locale: "en-CA" },
  AUD: { label: "Australian dollar", locale: "en-AU" },
  JPY: { label: "Japanese yen", locale: "en-US" },
  CNY: { label: "Chinese yuan", locale: "en-US" },
} as const;

type Currency = keyof typeof currencies;
type ForeignCurrency = Exclude<Currency, "CNY">;
type Rate = { value: number; date: string };
type Rates = Record<ForeignCurrency, Rate>;

const storageKey = "findthat:currency";
const currencyOptions = Object.entries(currencies).map(([value, entry]) => ({ value, label: `${value} · ${entry.label}` }));
const snapshotDate = "2026-11-19";
const snapshot: Rates = {
  USD: { value: 0.15009, date: snapshotDate },
  GBP: { value: 0.114, date: snapshotDate },
  EUR: { value: 0.13666, date: snapshotDate },
  CAD: { value: 0.21492, date: snapshotDate },
  AUD: { value: 0.22365, date: snapshotDate },
  JPY: { value: 23.962, date: snapshotDate },
};

let rateRequest: Promise<Rates> | undefined;

function getRates() {
  rateRequest ??= fetch("https://api.frankfurter.dev/v2/rates?base=CNY&quotes=USD,GBP,EUR,CAD,AUD,JPY", {
    signal: AbortSignal.timeout(6000),
  }).then(async (response) => {
    if (!response.ok) throw new Error("Exchange rates unavailable");
    const rows: { base: string; quote: string; rate: number; date: string }[] = await response.json();
    const rates = { ...snapshot };
    for (const row of rows) {
      if (row.base === "CNY" && Object.hasOwn(snapshot, row.quote) && Number.isFinite(row.rate)
        && row.rate > 0 && /^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
        const key = row.quote as ForeignCurrency;
        if (row.date >= rates[key].date) rates[key] = { value: row.rate, date: row.date };
      }
    }
    return rates;
  }).catch(() => {
    rateRequest = undefined;
    return snapshot;
  });
  return rateRequest;
}

export function CurrencyPrice({ amount }: { amount: number }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [rates, setRates] = useState(snapshot);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && Object.hasOwn(currencies, saved)) setCurrency(saved as Currency);
    } catch { /* Keep the current preference if storage is unavailable. */ }
    let active = true;
    void getRates().then((value) => { if (active) setRates(value); });
    return () => { active = false; };
  }, []);

  const rate = currency === "CNY" ? undefined : rates[currency];
  const local = rate && new Intl.NumberFormat(currencies[currency].locale, { style: "currency", currency }).format(amount * rate.value);
  const yuan = `¥${amount.toLocaleString("en-US")}`;

  return (
    <div className="detail-price-row" title={rate ? `Estimated using Frankfurter reference rates for ${rate.date}` : undefined}>
      <div className="detail-price">
        <FilterSelect label="Display currency" className={local ? "currency-price-trigger" : "currency-price-trigger currency-price-yuan"}
          value={currency} displayValue={local || yuan} options={currencyOptions}
          onChange={(value) => {
            const choice = value as Currency;
            setCurrency(choice);
            try { localStorage.setItem(storageKey, choice); } catch { /* Keep the current preference. */ }
          }} />
        {local && <><span className="detail-price-separator" aria-hidden="true">≈</span><strong>{yuan}</strong></>}
        <span className="sr-only" role="status">{local ? `${local} estimated for ${yuan}` : yuan}</span>
      </div>
    </div>
  );
}
