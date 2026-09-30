// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoJSONTable} from '@loaders.gl/schema';

/** Bounds for opt-in service pagination; exhausting a bound throws rather than returning partial data. */
export type FeaturePaginationOptions = {
  /** Requested first-page size. Defaults to 1000; servers may return fewer features. */
  pageSize?: number;
  /** Maximum fetched pages, including the first. Defaults to 100. */
  maxPages?: number;
  /** Maximum accumulated features, before any application deduplication. Defaults to 100000. */
  maxFeatures?: number;
};

/** One normalized page and the actual response URL used to resolve relative links. */
export type FeaturePage = {
  /** Decoded features, counts and paging links. */
  table: GeoJSONTable;
  /** Response URL, or the requested URL when the response has no URL. */
  url: string;
};

/** Validates and fills in pagination limits before any network request. */
export function getPaginationOptions(
  options: FeaturePaginationOptions = {}
): Required<FeaturePaginationOptions> {
  const limits = {
    pageSize: options.pageSize ?? 1000,
    maxPages: options.maxPages ?? 100,
    maxFeatures: options.maxFeatures ?? 100000
  };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1)
      throw new Error(`${name} must be a positive safe integer`);
  }
  return limits;
}

/**
 * Traverses service pages without guessing an offset for protocols that do not define one.
 * Links must remain on the original origin. Inconsistent counts, repeated pages/IDs, cancellation
 * and exhausted limits fail the operation. Unknown totals stay unknown in the returned pages.
 */
export async function* iterateFeaturePages(
  initialURL: string,
  fetchPage: (url: string) => Promise<FeaturePage>,
  options: FeaturePaginationOptions,
  signal?: AbortSignal,
  getOffsetURL?: (
    url: string,
    table: GeoJSONTable,
    featureCount: number,
    matchedCount: number | undefined
  ) => string | undefined
): AsyncIterable<GeoJSONTable> {
  const limits = getPaginationOptions(options);
  const visitedURLs = new Set<string>();
  const pageContents = new Set<string>();
  const identifiers = new Set<string | number>();
  let url: string | undefined = initialURL;
  let pageCount = 0;
  let featureCount = 0;
  let matchedCount: number | undefined;
  while (url) {
    throwIfAborted(signal);
    url = resolvePageURL(url, initialURL, initialURL);
    if (visitedURLs.has(url)) throw new Error('Feature pagination repeated a page URL');
    if (pageCount >= limits.maxPages) throw new Error('Feature pagination exceeded maxPages');
    visitedURLs.add(url);
    const page = await fetchPage(url);
    throwIfAborted(signal);
    const {table} = page;
    if (table.type !== 'FeatureCollection' || !Array.isArray(table.features))
      throw new Error('Feature page was not a GeoJSON FeatureCollection');
    const metadata = table as GeoJSONTable & {
      numberMatched?: unknown;
      totalFeatures?: unknown;
      numberReturned?: unknown;
    };
    const matchedValue = metadata.numberMatched ?? metadata.totalFeatures;
    const matched = getCount(matchedValue);
    if (matchedValue !== undefined && matchedValue !== 'unknown' && matched === undefined)
      throw new Error('Feature page contains an invalid numberMatched count');
    if (
      metadata.numberReturned !== undefined &&
      getCount(metadata.numberReturned) !== table.features.length
    )
      throw new Error('Feature page numberReturned does not match its features');
    if (matched !== undefined) {
      if (matchedCount !== undefined && matched !== matchedCount)
        throw new Error('Feature pagination numberMatched changed between pages');
      matchedCount = matched;
    }
    featureCount += table.features.length;
    if (featureCount > limits.maxFeatures)
      throw new Error('Feature pagination exceeded maxFeatures');
    if (matchedCount !== undefined && featureCount > matchedCount)
      throw new Error('Feature pagination returned more features than numberMatched');
    if (table.features.length) {
      const contents = JSON.stringify(table.features);
      if (pageContents.has(contents)) throw new Error('Feature pagination repeated page contents');
      pageContents.add(contents);
      for (const feature of table.features) {
        if (feature.id !== undefined) {
          if (identifiers.has(feature.id))
            throw new Error('Feature pagination repeated a feature ID');
          identifiers.add(feature.id);
        }
      }
    }
    const next = getNextLink(table);
    const nextURL = next
      ? resolvePageURL(next, page.url, initialURL)
      : getOffsetURL?.(url, table, featureCount, matchedCount);
    if (nextURL && !table.features.length) throw new Error('Feature pagination made no progress');
    pageCount++;
    yield table;
    url = nextURL;
  }
}

/** Gathers pages once, keeping unknown totals unknown and removing page-specific links/extents. */
export async function collectFeaturePages(
  pages: AsyncIterable<GeoJSONTable>
): Promise<GeoJSONTable> {
  let result: GeoJSONTable | undefined;
  for await (const page of pages) {
    if (!result) result = {...page, features: []};
    for (const feature of page.features) result.features.push(feature);
    const metadata = result as GeoJSONTable & Record<string, unknown>;
    const pageMetadata = page as GeoJSONTable & Record<string, unknown>;
    if (getCount(pageMetadata.numberMatched) !== undefined)
      metadata.numberMatched = pageMetadata.numberMatched;
    if (getCount(pageMetadata.totalFeatures) !== undefined)
      metadata.totalFeatures = pageMetadata.totalFeatures;
  }
  if (!result) throw new Error('Feature pagination returned no pages');
  const metadata = result as GeoJSONTable & Record<string, unknown>;
  metadata.numberReturned = result.features.length;
  delete metadata.links;
  delete metadata.next;
  delete metadata.previous;
  delete metadata.bbox;
  return result;
}

/** Reads next links from GeoJSON or normalized WFS GML metadata. */
function getNextLink(table: GeoJSONTable): string | undefined {
  const metadata = table as GeoJSONTable & {links?: {rel?: string; href?: string}[]; next?: string};
  const nextLinks = metadata.links?.filter(link => link.rel === 'next') || [];
  if (nextLinks.length > 1) throw new Error('Feature page contains ambiguous next links');
  if (nextLinks.length && nextLinks[0].href === undefined)
    throw new Error('Feature page contains an invalid next link');
  const next = metadata.next ?? nextLinks[0]?.href;
  if (next !== undefined && (typeof next !== 'string' || !next.trim()))
    throw new Error('Feature page contains an invalid next link');
  return next;
}

/** Accepts only finite, nonnegative integer counts, never unknown counts or numeric strings. */
export function getCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

/** Resolves relative links while preventing origin changes and embedded credentials. */
function resolvePageURL(href: string, baseURL: string, initialURL: string): string {
  const url = new URL(href, baseURL);
  if (
    url.origin !== new URL(initialURL).origin ||
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error('Feature pagination requires same-origin HTTP links without credentials');
  url.hash = '';
  return url.toString();
}

/** Checks cancellation before requests and after response decoding. */
export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Feature request aborted', 'AbortError');
}

/** Adds an HTTP Link-header next relation when the body does not already provide one. */
export function addNextLinkHeader(table: GeoJSONTable, header: string | null): GeoJSONTable {
  if (!header || getNextLink(table)) return table;
  const nextLinks: {rel: string; href: string}[] = [];
  for (const match of header.matchAll(/<([^>]+)>((?:[^,"]|"[^"]*")*)/g)) {
    const relation = match[2].match(/;\s*rel\s*=\s*(?:"([^"]*)"|([^;\s,]+))/i);
    if ((relation?.[1] || relation?.[2] || '').split(/\s+/).includes('next'))
      nextLinks.push({rel: 'next', href: match[1]});
  }
  if (!nextLinks.length) return table;
  const metadata = table as GeoJSONTable & {links?: unknown[]};
  return {...table, links: [...(metadata.links || []), ...nextLinks]} as GeoJSONTable;
}
