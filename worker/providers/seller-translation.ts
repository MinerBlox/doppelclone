import { record, text } from "./normalize";

const han = /\p{Script=Han}/u;

export interface SellerTranslationBinding {
  run(model: string, input: { text: string; source_lang: string; target_lang: string }): Promise<unknown>;
}

export async function translateSellerName(name: string, binding?: SellerTranslationBinding): Promise<string | undefined> {
  if (!binding || !han.test(name)) return;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      new Promise<undefined>((resolve) => { timeout = setTimeout(() => resolve(undefined), 1500); }),
      binding.run("@cf/meta/m2m100-1.2b", { text: name, source_lang: "zh", target_lang: "en" }),
    ]);
    const translated = text(record(result).translated_text);
    return translated && !han.test(translated) ? translated : undefined;
  } catch {
    return;
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
