# FindThat

A frontend for discovering products from 1688, Weidian and Taobao, with a static demo catalog and an optional marketplace lookup Worker.

## Local preview

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Use `npm run typecheck` for TypeScript or `npm run build` to export the static site to `out/`.

## GitHub Pages

GitHub Pages serves the static export from the root of `main` at [minerblox.github.io/doppelclone](https://minerblox.github.io/doppelclone/). Build with `NEXT_PUBLIC_BASE_PATH=/doppelclone` so the bundle, photos, and links work at the project URL. Publish the contents of `out/` at the repository root alongside `.nojekyll`. Keep generated files in sync with the source when publishing updates.

## Discovery and marketplace lookup

Keyword search and filters update the Discover demo catalog on the homepage. Select a demo card to see its fictional product details and any generated sample QC photos.

Paste an original marketplace link into the search bar to look up a live listing. FindThat accepts direct 1688 offer, Taobao item, and Weidian item URLs and ignores tracking parameters. Share links that require redirects are unsupported. Successful results reuse the product detail and QC gallery components at `/lookup/`. Errors and disconnected providers have dedicated states.

| Data source | Setup and status |
| --- | --- |
| 1688 | The adapter uses the documented [Nexscope Product Detail API](https://www.nexscope.ai/api-docs/1688-product-detail). It needs a bearer key with access to that endpoint and sufficient credits. |
| Taobao | URL parsing works. Live lookup needs approved item-detail access. The [seller item API](https://open.alitrip.com/doc2/apiDetail.htm?apiId=24625) requires an authorized seller session. |
| Weidian | URL parsing works. Live lookup needs an approved app and authorized access to item details through the [Weidian Open Platform](https://open.weidian.com/), or a licensed provider. |
| QC photos | No approved feed is configured. The Worker can attach authorized agent records with source, original product ID, image URL, and optional capture date, SKU, and QC group. An observed HipoBuy browser endpoint does not grant permission to access or republish its photos. |

### Run live lookup locally

1. Copy `.env.example` to `.env.local` and `worker/.dev.vars.example` to `worker/.dev.vars`.
2. Set `NEXSCOPE_API_KEY` in `worker/.dev.vars` only. Confirm that the provider permits redisplay of product data and images and the caching described below.
3. Start the Worker in one terminal and the frontend in another.

```sh
npx wrangler@4 dev --config worker/wrangler.jsonc
npm run dev
```

Paste `https://detail.1688.com/offer/990295210139.html` into the search bar, or query the Worker directly:

```sh
curl --get --data-urlencode 'url=https://detail.1688.com/offer/990295210139.html' http://127.0.0.1:8787/v1/product
```

### Deploy the Worker and static frontend

1. Set `ALLOWED_ORIGINS` in `worker/wrangler.jsonc` to the exact frontend origins. For the current Pages project, use `https://minerblox.github.io` without the repository path.
2. Run the following from an authorized Cloudflare account. Enter the key at the secret prompt.

```sh
npx wrangler@4 login
npx wrangler@4 deploy --config worker/wrangler.jsonc
npx wrangler@4 secret put NEXSCOPE_API_KEY --config worker/wrangler.jsonc
```

3. Verify the sample URL against the deployed endpoint before releasing the frontend. Rebuild with `NEXT_PUBLIC_LOOKUP_API_URL` set to the deployed Worker origin and `NEXT_PUBLIC_BASE_PATH=/doppelclone`, then use the existing Pages publishing process above. The public endpoint variable is read at build time. The demo remains available without it.

Successful lookups are cached for five minutes at the edge by canonical marketplace and product ID. Uncached upstream requests are limited to 12 per minute per client IP at each Cloudflare location. The endpoint is public and the limit is local to each location, so configure a provider spend cap or separate budget control before a public release.

## Architecture

- `src/app` holds App Router pages, the global shell layout, and theme tokens.
- `src/components` holds the header, discovery controls, reusable product cards, and shadcn UI primitives.
- `src/lib/catalog` holds domain models, fixtures, URL normalization, and the async server-side `CatalogService` interface. Future providers can implement the interface using live APIs.
- `src/lib/lookup` holds the shared live lookup contract and browser client.
- `worker/providers` holds the server-only 1688 adapter, product resolver and authorized QC adapter contract. Register new product or QC adapters in `worker/index.ts`.
- `public/catalog` holds local WebP samples served as static files.

Run `npm run test:lookup` to verify URL parsing, data normalization, and Worker behavior with deterministic fixtures. Run `npm run typecheck` for both the frontend and the Worker.
