import { Discovery } from "@/components/discovery";
import { catalog } from "@/lib/catalog/service";

export default async function Home() {
  const items = await catalog.search();
  return <Discovery items={items} />;
}
