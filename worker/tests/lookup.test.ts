import assert from "node:assert/strict";
import test from "node:test";
import { looksLikeUrl, parseMarketplaceUrl } from "../../src/lib/catalog/marketplace";
import { create1688Provider, normalize1688 } from "../providers/1688";
import { normalizeLitBuy } from "../providers/litbuy";
import { resolveListing } from "../providers/resolver";
import { handleLookup } from "../index";

const offerUrl = "https://detail.1688.com/offer/990295210139.html";
const listing = parseMarketplaceUrl(offerUrl)!;
const now = new Date("2026-11-20T00:00:00Z");

function fixture() {
  return {
    code: 0,
    data: {
      offerId: listing.itemId,
      subject: "示例商品",
      companyName: "Fixture seller",
      categoryName: "Footwear",
      shippingInfo: { sendGoodsAddressText: "Guangzhou" },
      productImage: { images: [
        "//cbu01.alicdn.com/img/fixture.jpg",
        "https://cbu01.alicdn.com/img/fixture.jpg",
        "https://alicdn.com.evil.test/image.jpg",
        "javascript:alert(0)",
        "http://cbu01.alicdn.com/img/insecure.jpg",
      ] },
      saleInfo: { retailPrice: "48.50" },
      skuList: [{
        skuId: "90071992547409930003",
        retailPrice: "52.10",
        attributes: [{ value: "蓝色", valueTrans: "Blue", skuImageUrl: "https://cbu01.alicdn.com/img/blue.jpg" }, { value: "M" }],
      }],
    },
  };
}

test("normalizes the supplied 1688 offer without tracking parameters", () => {
  assert.deepEqual(parseMarketplaceUrl(" " + offerUrl + "?spm=test#sku "), {
    marketplace: "1688", itemId: "990295210139", url: offerUrl,
  });
  assert.deepEqual(parseMarketplaceUrl("m.1688.com/offer/990295210139.html"), listing);
});

test("normalizes Taobao desktop and mobile item links without rounding their IDs", () => {
  const original = "90071992547409931234";
  for (const url of [
    "https://item.taobao.com/item.htm?id=" + original,
    "https://h5.m.taobao.com/awp/core/detail.htm?source=x&id=" + original,
    "https://m.intl.taobao.com/detail/detail.html?id=" + original,
  ]) {
    assert.deepEqual(parseMarketplaceUrl(url), { marketplace: "Taobao", itemId: original, url: "https://item.taobao.com/item.htm?id=" + original });
  }
});

test("normalizes original Weidian item links", () => {
  assert.deepEqual(parseMarketplaceUrl("www.weidian.com/item.html?spider_token=s&itemID=7819495680"), {
    marketplace: "Weidian", itemId: "7819495680", url: "https://weidian.com/item.html?itemID=7819495680",
  });
});

test("rejects unsupported, ambiguous, and malformed links while allowing keyword searches", () => {
  for (const url of [
    "", "green shoes", "https://hipobuy.com/product/0/990295210139", "https://m.tb.cn/example",
    "https://detail.1688.com.evil.test/offer/990295210139.html", "https://u:p@detail.1688.com/offer/1.html",
    "https://detail.1688.com:444/offer/1.html", "ftp://detail.1688.com/offer/1.html", "https://item.taobao.com/item.htm?id=1&id=2",
    "https://weidian.com/item.html?itemID=0", "https://item.taobao.com/item.htm?id=-1",
    "https://item.taobao.com/item.htm?id=abc", "https://weidian.com\\item.html?itemID=1", "https:///weidian.com/item.html?itemID=1",
    "https://weidian.com/item.html?itemID=" + "9".repeat(33),
  ]) assert.equal(parseMarketplaceUrl(url), null, url);
  assert.equal(looksLikeUrl("https://example.test/item"), true);
  assert.equal(looksLikeUrl("www.weidian.com/item.html?itemID=7819495680"), true);
  assert.equal(looksLikeUrl("straight indigo jeans"), false);
});

test("normalizes the documented envelope, exact SKU IDs, CNY, images, and seller", () => {
  const product = normalize1688(fixture(), listing, now);
  assert.equal(product.name, "示例商品");
  assert.deepEqual(product.price, { basis: "unit", amountCny: 48.5 });
  assert.deepEqual(product.seller, { name: "Fixture seller", city: "Guangzhou" });
  assert.deepEqual(product.photos.map((photo) => photo.src), ["https://cbu01.alicdn.com/img/fixture.jpg"]);
  assert.deepEqual(product.styles[0], {
    id: "90071992547409930003", name: "Blue / M",
    photo: { src: "https://cbu01.alicdn.com/img/blue.jpg", alt: "Blue / M" }, priceCny: 52.1,
  });
  assert.equal(product.retrievedAt, now.toISOString());
});

test("keeps absent fields absent and labels quantity tiers correctly", () => {
  const product = normalize1688({
    code: 0, data: { subject: "Fixture", saleInfo: { priceRanges: [
      { price: "15", startQuantity: 20 }, { price: "18.25", startQuantity: 3 },
    ] } },
  }, listing, now);
  assert.deepEqual(product.price, { basis: "quantity-tier", amountCny: 18.25, minQuantity: 3 });
  assert.equal(product.seller, undefined);
  assert.deepEqual(product.photos, []);
  assert.deepEqual(product.styles, []);
  assert.equal(normalize1688({ code: 0, data: { subject: "No price" } }, listing, now).price, undefined);
  assert.throws(() => normalize1688({ code: 0, data: { offerId: "12", subject: "Different listing" } }, listing, now),
    { message: "provider_unavailable" });
});

test("works through the documented authenticated 1688 request contract with a fixture", async () => {
  const adapter = create1688Provider("fixture-key", async (input) => {
    assert.ok(input instanceof Request);
    assert.equal(input.url, "https://api.nexscope.ai/alibaba1688/productDetail");
    assert.equal(input.headers.get("Authorization"), "Bearer fixture-key");
    assert.equal(input.method, "POST");
    assert.deepEqual(await input.json(), { offerId: listing.itemId, currency: "CNY" });
    return Response.json(fixture());
  });
  const result = await resolveListing(listing, [adapter]);
  if (!result.ok) assert.fail(result.message);
  assert.equal(result.product.name, "示例商品");
  assert.deepEqual(result.qc, { status: "unavailable", photos: [] });
});

test("distinguishes empty QC from disconnected QC and preserves only known photo metadata", async () => {
  const product = create1688Provider("fixture-key", async () => Response.json(fixture()));
  const noPhotos = { agent: "Authorized fixture source", supports: () => true, getPhotos: async () => [] };
  const empty = await resolveListing(listing, [product], [noPhotos]);
  assert.ok(empty.ok);
  assert.deepEqual(empty.qc, { status: "none", photos: [] });
  const available = await resolveListing(listing, [product], [{
    ...noPhotos,
    getPhotos: async () => [{ id: "qc-1", src: "https://example.test/qc.jpg", alt: "QC image", skuId: "15" }],
  }]);
  assert.ok(available.ok);
  assert.deepEqual(available.qc, {
    status: "available", photos: [{ id: "qc-1", src: "https://example.test/qc.jpg", alt: "QC image", skuId: "15",
      originalProductId: listing.itemId, sourceAgent: "Authorized fixture source" }],
  });
  const failed = await resolveListing(listing, [product], [{ ...noPhotos, getPhotos: async () => { throw Error("offline"); } }]);
  assert.ok(failed.ok);
  assert.equal(failed.qc.status, "unavailable");
});

test("times out, aborts upstream, and does not retry a timed-out product request", async () => {
  let calls = 0;
  let requestSignal: AbortSignal | null | undefined;
  const adapter = create1688Provider("fixture-key", async (_, init) => {
    calls++;
    requestSignal = init?.signal;
    return new Promise<Response>(() => {});
  });
  const result = await resolveListing(listing, [adapter], [], 8);
  assert.equal(calls, 1);
  assert.equal(requestSignal?.aborted, true);
  assert.equal(!result.ok && result.code, "timeout");
});

test("retries one transient 503 and honors upstream Retry-After", async () => {
  let calls = 0;
  const recovered = create1688Provider("fixture-key", async () => ++calls === 1
    ? new Response(null, { status: 503 }) : Response.json(fixture()));
  assert.ok((await resolveListing(listing, [recovered])).ok);
  assert.equal(calls, 2);

  calls = 0;
  const deferred = create1688Provider("fixture-key", async () => {
    calls++;
    return new Response(null, { status: 503, headers: { "Retry-After": "15" } });
  });
  assert.equal((await resolveListing(listing, [deferred])).ok, false);
  assert.equal(calls, 1);
});

test("distinguishes provider failures, rate limits, and unconfigured marketplaces", async () => {
  for (const [status, code] of [[404, "not_found"], [401, "provider_unavailable"], [429, "rate_limited"], [500, "provider_unavailable"]] as const) {
    const adapter = create1688Provider("fixture-key", async () => new Response(null, { status }));
    const result = await resolveListing(listing, [adapter]);
    assert.equal(!result.ok && result.code, code);
  }
  for (const payload of [{ code: 11209, msg: "internal message" }, { code: 0, data: {} }]) {
    const broken = create1688Provider("fixture-key", async () => Response.json(payload));
    const result = await resolveListing(listing, [broken]);
    assert.equal(!result.ok && result.code, "provider_unavailable");
    assert.doesNotMatch(JSON.stringify(result), /internal message/);
  }
  const notConnected = await resolveListing(listing, []);
  assert.equal(!notConnected.ok && notConnected.code, "not_configured");
});

test("Worker validates input and origins before calling a provider and caches a canonical successful result", async () => {
  const origin = "https://minerblox.github.io";
  const env = { NEXSCOPE_API_KEY: "fixture-key", ALLOWED_ORIGINS: origin };
  const endpoint = "https://api.example.test/v1/product?url=";
  const context = { waitUntil: (_: Promise<unknown>) => {} };
  const memory = new Map<string, Response>();
  const cache = {
    match: async (input: RequestInfo | URL) => memory.get((input as Request).url)?.clone(),
    put: async (input: RequestInfo | URL, response: Response) => { memory.set((input as Request).url, response.clone()); },
  };
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return Response.json(fixture()); };
  const run = (url: string, caller = origin) =>
    handleLookup(new Request(endpoint + encodeURIComponent(url), { headers: { Origin: caller } }), env, context, cache, fetcher);

  assert.equal((await run(offerUrl, "https://other.test")).status, 403);
  assert.equal((await run("https://example.test/product")).status, 400);
  assert.equal((await run("https://item.taobao.com/item.htm?id=12345")).status, 503);
  assert.equal(calls, 0);
  const success = await run(offerUrl + "?spm=one");
  assert.equal(success.status, 200);
  assert.equal(success.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal((await success.json()).ok, true);
  assert.equal((await run(offerUrl + "?spm=two")).status, 200);
  assert.equal(calls, 1);
});

test("Worker does not bill a lookup when no API key is configured or the quota rejects it", async () => {
  const env = { ALLOWED_ORIGINS: "" };
  const req = new Request("https://api.example.test/v1/product?url=" + encodeURIComponent(offerUrl));
  const ctx = { waitUntil: (_: Promise<unknown>) => {} };
  const fetcher: typeof fetch = async () => assert.fail("upstream was called");
  const unconfigured = await handleLookup(req, env, ctx, undefined, fetcher);
  assert.equal((await unconfigured.json()).code, "not_configured");
  const limited = await handleLookup(req, { ...env, NEXSCOPE_API_KEY: "fixture-key",
    LOOKUP_RATE_LIMIT: { limit: async () => ({ success: false }) } }, ctx, undefined, fetcher);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "60");
});

const litBuyOffer = parseMarketplaceUrl("https://detail.1688.com/offer/746801458197.html")!;

function litBuyFixture() {
  return {
    success: true, code: 200,
    result: {
      channel: "1688", spuNo: litBuyOffer.itemId, subject: "Fixture knit shirt", shopName: "Fixture knitwear seller",
      description: "<div>Unused listing HTML</div>",
      mainImg: "https://cbu01.alicdn.com/img/knit.jpg",
      imageList: ["//cbu01.alicdn.com/img/knit.jpg", "https://cbu01.alicdn.com/img/back.jpg", "https://example.test/fake.jpg"],
      startQuantity: 1, price: 15.55, priceUSD: 15.55, priceCNY: 88,
      saleInfo: { priceRangeList: [{ startQuantity: 500, priceCNY: "75" }, { startQuantity: 1, priceCNY: "88" }] },
      skuVoList: [{
        skuNo: "9530fe59de760ff8676a48417ebcb7bf", spuNo: litBuyOffer.itemId, channel: "1688", priceCNY: null,
        skuAttr: [
          { name: "Color", enumValue: "Dark gray", enumImageUrl: "https://cbu01.alicdn.com/img/gray.jpg" },
          { name: "Size", enumValue: "M", enumImageUrl: null },
        ],
      }],
    },
  };
}

test("normalizes LitBuy product fields from the observed 1688 response shape", () => {
  const product = normalizeLitBuy(litBuyFixture(), litBuyOffer, now);
  assert.equal(product.provider, "LitBuy");
  assert.equal(product.name, "Fixture knit shirt");
  assert.deepEqual(product.seller, { name: "Fixture knitwear seller" });
  assert.deepEqual(product.price, { amountCny: 88, basis: "unit" });
  assert.deepEqual(product.photos.map(({ src }) => src), [
    "https://cbu01.alicdn.com/img/knit.jpg", "https://cbu01.alicdn.com/img/back.jpg",
  ]);
  assert.equal(product.styles[0]?.id, "9530fe59de760ff8676a48417ebcb7bf");
  assert.equal(product.styles[0]?.name, "Dark gray / M");
  assert.equal(product.styles[0]?.photo?.src, "https://cbu01.alicdn.com/img/gray.jpg");
  assert.equal(product.styles[0]?.priceCny, undefined);
});

test("LitBuy distinguishes tier pricing, missing CNY, and provider errors", () => {
  const fixture = litBuyFixture();
  fixture.result.saleInfo.priceRangeList.shift();
  fixture.result.saleInfo.priceRangeList[0].startQuantity = 200;
  assert.deepEqual(normalizeLitBuy(fixture, litBuyOffer, now).price,
    { amountCny: 88, basis: "quantity-tier", minQuantity: 200 });
  const usdOnly = { ...fixture, result: { ...fixture.result, saleInfo: null, priceCNY: null } };
  assert.equal(normalizeLitBuy(usdOnly, litBuyOffer, now).price, undefined);
  assert.throws(() => normalizeLitBuy(fixture, listing, now), { message: "provider_unavailable" });
  assert.throws(() => normalizeLitBuy({ ...fixture, result: null }, litBuyOffer, now), { message: "not_found" });
  assert.throws(() => normalizeLitBuy({ success: false, code: 403 }, litBuyOffer, now), { message: "provider_unavailable" });
});

test("Worker opts into LitBuy, sends only the canonical offer ID, and isolates provider caches", async () => {
  const request = new Request("https://api.example.test/v1/product?url="
    + encodeURIComponent(litBuyOffer.url + "?spm=tracking"));
  const env = { ALLOWED_ORIGINS: "", NEXSCOPE_API_KEY: "fixture-key", LOOKUP_1688_PROVIDER: "litbuy" };
  const context = { waitUntil: (_: Promise<unknown>) => {} };
  const matched: string[] = [];
  const stored: string[] = [];
  const cache = {
    match: async (input: RequestInfo | URL) => { matched.push(new URL((input as Request).url).pathname); return undefined; },
    put: async (input: RequestInfo | URL) => { stored.push(new URL((input as Request).url).pathname); },
  };
  const fetcher: typeof fetch = async (input, init) => {
    assert.ok(input instanceof Request);
    assert.equal(input.url, "https://gateway.litbuy.com/unified-service/catalog-service/profile"
      + "?channel=1688&refresh=0&spuNo=746801458197&activityCode=&linkSearch=true");
    assert.equal(input.method, "GET");
    assert.equal(input.headers.has("Authorization"), false);
    assert.equal(input.headers.has("Cookie"), false);
    assert.equal(init?.redirect, "error");
    return Response.json(litBuyFixture());
  };
  const response = await handleLookup(request, env, context, cache, fetcher);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.product.provider, "LitBuy");
  assert.deepEqual(payload.qc, { status: "unavailable", photos: [] });
  assert.deepEqual(matched, ["/_cache/product/v1/litbuy/746801458197"]);
  assert.deepEqual(stored, matched);
});
