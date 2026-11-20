import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductDetails } from "@/components/product-details";
import { catalog } from "@/lib/catalog/service";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await catalog.search()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await catalog.getProduct((await params).slug);
  return item ? { title: `${item.name} | FindThat`, description: item.photo.alt } : {};
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const item = await catalog.getProduct(slug);
  if (!item) notFound();

  return (
    <main className="shell product-page" id="main">
      <Link className="product-back" href="/#discover"><ArrowLeft size={16} aria-hidden="true" /> Discover</Link>
      <ProductDetails item={item} photos={await catalog.getQcImages(slug)} />
    </main>
  );
}
