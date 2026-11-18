import { Discovery } from "@/components/discovery";
import { catalog } from "@/lib/catalog/service";

export default async function Home() {
  const items = await catalog.search();
  const photosBySlug = Object.fromEntries(await Promise.all(
    items.map(async ({ slug }) => [slug, await catalog.getQcImages(slug)] as const),
  ));

  return <Discovery items={items} photosBySlug={photosBySlug} />;
}
