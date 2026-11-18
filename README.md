# Fieldwork

A local frontend for discovering products from 1688, Weidian and Taobao and viewing sample quality check photos.

## Local preview

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Use `npm run typecheck` for TypeScript or `npm run build` to build the production bundle.

## First slice

The homepage supports keyword search, direct marketplace item URLs, category and marketplace filters, sorting, a QC-only view, and product previews. Filters update the Discover grid immediately on the homepage. Select a card to see the seller, sample source URL, and any available QC images. The URL shown in each preview can be pasted into search to find that item.

The catalog, source IDs, sellers, and QC records are fictional. The product and warehouse illustrations are generated sample photographs. Supported URL formats are direct 1688 offer, Weidian item, and Taobao item URLs. Tracking parameters are ignored. Redirect and share links are deferred.

## Architecture

- `src/app` holds App Router pages, the global shell layout, and theme tokens.
- `src/components` holds the header, discovery controls, reusable product cards, and shadcn UI primitives.
- `src/lib/catalog` holds domain models, fixtures, URL normalization, and the async server-side `CatalogService` interface. Future providers can implement the interface using live APIs.
- `public/catalog` holds local WebP samples served through Next.js image optimization.

The next slices add `/search`, `/products/[slug]`, `/qc`, `/collections`, and `/users/[handle]`. The homepage provides the working discovery and QC interactions for this slice.
