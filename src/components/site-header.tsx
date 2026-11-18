import { ScanLine } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="header">
      <div className="shell header-inner">
        <Link className="wordmark striped-wordmark" data-shadow="findthat.net" href="/" aria-label="FindThat home">findthat.net</Link>
        <nav aria-label="Main navigation">
          <Link className="nav-link" href="/#discover">Discover</Link>
          <Link className="nav-link" href="/#qc"><ScanLine size={15} aria-hidden="true" /> QC photos</Link>
        </nav>
      </div>
    </header>
  );
}
