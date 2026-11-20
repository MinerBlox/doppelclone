import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LookupResult } from "@/components/lookup-result";

export const metadata: Metadata = { title: "Product lookup | FindThat", robots: { index: false } };

export default function LookupPage() {
  return (
    <main className="shell product-page" id="main">
      <Link href="/" className="product-back"><ArrowLeft size={16} aria-hidden="true" /> Back to FindThat</Link>
      <Suspense fallback={<div className="empty-state"><p role="status">Looking up product…</p></div>}>
        <LookupResult />
      </Suspense>
    </main>
  );
}
