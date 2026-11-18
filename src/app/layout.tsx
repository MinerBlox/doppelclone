import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "China: Made Easy. | Fieldwork",
  description: "Discover independent finds from 1688, Weidian and Taobao, with quality check photos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        {children}
        <footer className="shell site-footer">
          <a className="wordmark" href="/">Fieldwork<span>.</span></a>
          <p>Marketplace discovery · Preview catalog</p>
        </footer>
      </body>
    </html>
  );
}
