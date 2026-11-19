import { Discovery } from "@/components/discovery";
import { catalog } from "@/lib/catalog/service";

export default async function Home() {
  const [items, collections] = await Promise.all([catalog.search(), catalog.listCollections()]);
  return <Discovery items={items} collections={collections} />;
}
