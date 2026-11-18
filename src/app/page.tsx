import { Discovery } from "@/components/discovery";
import { catalog } from "@/lib/catalog/service";
import { categories, marketplaces, sorts, type CatalogQuery } from "@/lib/catalog/types";

type SearchParams = Record<string, string | string[] | undefined>;

function readChoice<T extends string>(values: readonly T[], value: unknown) {
  return values.find((item) => item === value);
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const initialState: CatalogQuery = {
    query: typeof params.q === "string" ? params.q.trim().slice(0, 1000) : "",
    category: readChoice(categories, params.category),
    marketplace: readChoice(marketplaces, params.source),
    qcOnly: params.qc === "1",
    sort: readChoice(sorts, params.sort),
  };
  const items = await catalog.search();
  const photosBySlug = Object.fromEntries(await Promise.all(
    items.map(async ({ slug }) => [slug, await catalog.getQcImages(slug)] as const),
  ));

  return <Discovery initialState={initialState} items={items} photosBySlug={photosBySlug} />;
}
