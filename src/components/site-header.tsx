import { ScanLine } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/" aria-label="Fieldwork home">Fieldwork<span>.</span></Link>
        <nav aria-label="Main navigation">
          <a className="nav-link" href="#discover">Discover</a>
          <a className="nav-link" href="#qc"><ScanLine size={15} aria-hidden="true" /> QC photos</a>
        </nav>
      </div>
    </header>
  );
}
