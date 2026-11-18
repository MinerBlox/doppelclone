import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/geist";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { publicAsset } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FindThat | China: Made easy.",
  description: "Discover independent finds from 1688, Weidian and Taobao, with quality check photos.",
  icons: { icon: publicAsset("/findthat-icon.png") },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        {children}
        <footer className="shell site-footer">
          <Link className="wordmark" href="/">findthat<span>.</span>net</Link>
          <p>Marketplace discovery · Preview catalog</p>
        </footer>
      </body>
    </html>
  );
}
