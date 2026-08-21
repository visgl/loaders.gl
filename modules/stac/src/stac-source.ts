// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CatalogSource,
  CatalogSourceCapabilities,
  CoreAPI,
  SourceLoader
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

import {STACSourceLoader as STACSourceLoaderMetadata} from './stac-source-loader-types';
import type {STACSourceLoaderOptions} from './stac-source-loader-types';
import type {
  STACAssetSelection,
  STACBoundingBox,
  STACCatalog,
  STACCollection,
  STACCollections,
  STACItem,
  STACItemCollection,
  STACLink,
  STACObject,
  STACResolvedAsset,
  STACSearchQuery,
  STACSourceMetadata,
  STACTraversalOptions
} from './stac-types';

const DEFAULT_MAX_DEPTH = 32;
const DEFAULT_MAX_REQUESTS = 1000;

const {
  preload: _preloadSTACSourceLoader,
  createDataSource: _createMetadataDataSource,
  ...STACSourceLoaderBase
} = STACSourceLoaderMetadata;

/** Runtime source factory for static STAC catalogs and STAC APIs. */
export const STACSourceLoaderWithParser = {
  ...STACSourceLoaderBase,
  createDataSource(
    data: string | Blob,
    options: STACSourceLoaderOptions,
    coreApi?: CoreAPI
  ): STACSource {
    if (typeof data !== 'string') {
      throw new Error('STACSource requires a catalog URL');
    }
    return new STACSource(data, options, coreApi);
  }
} as const satisfies SourceLoader<STACSource>;

/** Runtime STAC source loader exposed by the explicit package subpath. */
export {STACSourceLoaderWithParser as STACSourceLoader};

type STACRequest = {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
};

type STACTraversalEntry = {
  url: string;
  depth: number;
};

/**
 * Lightweight source for static STAC catalogs and STAC API Item Search.
 *
 * Static catalogs are only crawled through the explicit `traverse()` method. `search()` is reserved
 * for server-side STAC API Item Search, preventing an accidental crawl of a planet-scale catalog.
 */
export class STACSource
  extends DataSource<string, STACSourceLoaderOptions>
  implements CatalogSource<STACItem, STACSearchQuery, STACSourceMetadata>
{
  /** Features exposed through the protocol-neutral catalog interface. */
  readonly capabilities: CatalogSourceCapabilities = Object.freeze({
    search: true,
    pagination: true,
    hierarchy: true,
    spatialFilter: true,
    temporalFilter: true,
    textFilter: false,
    cql2Filter: false,
    collections: true,
    assets: true
  });

  /** Cached root initialization shared by metadata and query methods. */
  private rootPromise: Promise<STACCatalog | STACCollection> | null = null;
  /** Source document URL retained for resolving relative links and assets. */
  private readonly documentUrls = new WeakMap<object, string>();

  /** Creates a source for a static STAC root or STAC API landing page. */
  constructor(url: string, options: STACSourceLoaderOptions, coreApi?: CoreAPI) {
    super(url, options, STACSourceLoaderWithParser.defaultOptions, coreApi);
  }

  /** Returns the cached root Catalog or Collection. */
  async getRoot(options: {signal?: AbortSignal} = {}): Promise<STACCatalog | STACCollection> {
    throwIfAborted(options.signal);
    if (!this.rootPromise) {
      const rootPromise = this.fetchObject(this.url).then(object => {
        if (!isCatalog(object) && !isCollection(object)) {
          throw new Error(`STAC root must be a Catalog or Collection: ${this.url}`);
        }
        return object;
      });
      this.rootPromise = rootPromise;
      void rootPromise.catch(() => {
        if (this.rootPromise === rootPromise) {
          this.rootPromise = null;
        }
      });
    }
    return await waitForPromiseWithSignal(this.rootPromise, options.signal);
  }

  /** Returns root metadata and whether a STAC API search relation was discovered. */
  async getMetadata(options: {signal?: AbortSignal} = {}): Promise<STACSourceMetadata> {
    const root = await this.getRoot(options);
    const conformsTo = Array.isArray(root.conformsTo) ? root.conformsTo : [];
    return {
      root,
      mode: findLink(root.links, 'search') || conformsTo.length > 0 ? 'api' : 'static',
      conformsTo
    };
  }

  /**
   * Lists collections from an API Collections endpoint or a static catalog hierarchy.
   * Static traversal follows `child` links but never fetches Item links.
   */
  async getCollections(
    options: {signal?: AbortSignal; maxDepth?: number; maxRequests?: number} = {}
  ): Promise<STACCollection[]> {
    const metadata = await this.getMetadata({signal: options.signal});
    if (metadata.mode === 'api') {
      return await this.getAPICollections(metadata.root, options.signal);
    }
    return await this.getStaticCollections(metadata.root, options);
  }

  /**
   * Searches a STAC API and follows `next` links until all result pages are consumed.
   * Throws for static catalogs; use `traverse()` to opt into client-side crawling.
   */
  async *search(query: STACSearchQuery = {}): AsyncIterable<STACItem> {
    const root = await this.getRoot({signal: query.signal});
    const searchLink = findLink(root.links, 'search');
    if (!searchLink) {
      throw new Error('This is a static STAC catalog; use STACSource.traverse() explicitly');
    }

    let request: STACRequest | null = createSearchRequest(
      searchLink,
      this.getDocumentUrl(root),
      query
    );
    const visitedRequests = new Set<string>();
    while (request) {
      throwIfAborted(query.signal);
      const requestKey = getRequestKey(request);
      if (visitedRequests.has(requestKey)) {
        throw new Error(`STAC pagination cycle detected at ${request.url}`);
      }
      visitedRequests.add(requestKey);

      const page = await this.fetchItemCollection(request, query.signal);
      for (const item of page.features) {
        yield item;
      }
      const nextLink = findLink(page.links, 'next');
      request = nextLink ? createNextRequest(nextLink, this.getDocumentUrl(page), request) : null;
    }
  }

  /**
   * Explicitly traverses a static STAC link graph with cycle, depth, and request limits.
   * Optional standard Item Search constraints are evaluated locally.
   */
  async *traverse(options: STACTraversalOptions = {}): AsyncIterable<STACItem> {
    const root = await this.getRoot({signal: options.signal});
    const maxDepth = options.maxDepth ?? this.options.stac?.maxDepth ?? DEFAULT_MAX_DEPTH;
    const maxRequests =
      options.maxRequests ?? this.options.stac?.maxRequests ?? DEFAULT_MAX_REQUESTS;
    validateTraversalLimit('maxDepth', maxDepth);
    validateTraversalLimit('maxRequests', maxRequests);

    const rootUrl = this.getDocumentUrl(root);
    const queue: STACTraversalEntry[] = [{url: rootUrl, depth: 0}];
    const visitedUrls = new Set<string>();
    let requestCount = 0;

    while (queue.length > 0) {
      throwIfAborted(options.signal);
      const entry = queue.shift()!;
      if (visitedUrls.has(entry.url)) {
        continue;
      }
      if (requestCount >= maxRequests) {
        throw new Error(`STAC traversal exceeded maxRequests (${maxRequests})`);
      }
      visitedUrls.add(entry.url);
      requestCount++;

      const object =
        entry.url === rootUrl ? root : await this.fetchObject(entry.url, options.signal);
      if (isItem(object)) {
        if (matchesItem(object, options)) {
          yield object;
        }
        continue;
      }
      if (isItemCollection(object)) {
        for (const item of object.features) {
          if (matchesItem(item, options)) {
            yield item;
          }
        }
      }

      for (const link of object.links) {
        if (link.rel !== 'child' && link.rel !== 'item') {
          continue;
        }
        const depth = link.rel === 'child' ? entry.depth + 1 : entry.depth;
        if (depth <= maxDepth) {
          queue.push({url: resolveUrl(link.href, this.getDocumentUrl(object)), depth});
        }
      }
    }
  }

  /** Returns matching Item assets with document-relative URLs resolved to absolute URLs. */
  getAssets(item: STACItem, selection: STACAssetSelection = {}): STACResolvedAsset[] {
    const baseUrl = this.documentUrls.get(item) || this.url;
    const requiredRoles = new Set(selection.roles || []);
    const requiredMediaTypes = new Set(selection.mediaTypes || []);

    return Object.entries(item.assets)
      .filter(([, asset]) => {
        const matchesRole =
          requiredRoles.size === 0 || asset.roles?.some(role => requiredRoles.has(role));
        const matchesMediaType =
          requiredMediaTypes.size === 0 ||
          Boolean(asset.type && requiredMediaTypes.has(asset.type));
        return matchesRole && matchesMediaType;
      })
      .map(([key, asset]) => ({...asset, key, href: resolveUrl(asset.href, baseUrl)}));
  }

  /** Fetches every page from a STAC API Collections relation. */
  private async getAPICollections(
    root: STACCatalog | STACCollection,
    signal?: AbortSignal
  ): Promise<STACCollection[]> {
    const collectionsLink = findLink(root.links, 'data') || findLink(root.links, 'collections');
    if (!collectionsLink) {
      return isCollection(root) ? [root] : [];
    }

    const collections: STACCollection[] = [];
    const visitedUrls = new Set<string>();
    let url: string | null = resolveUrl(collectionsLink.href, this.getDocumentUrl(root));
    while (url) {
      throwIfAborted(signal);
      if (visitedUrls.has(url)) {
        throw new Error(`STAC Collections pagination cycle detected at ${url}`);
      }
      visitedUrls.add(url);
      const response = await this.fetch(url, {signal});
      assertResponse(response, url);
      const page = validateCollections(await response.json(), url);
      this.attachDocumentUrl(page, url);
      for (const collection of page.collections) {
        this.attachDocumentUrl(collection, url);
      }
      collections.push(...page.collections);
      const nextLink = findLink(page.links, 'next');
      url = nextLink ? resolveUrl(nextLink.href, url) : null;
    }
    return collections;
  }

  /** Traverses only static `child` links to collect Collection documents. */
  private async getStaticCollections(
    root: STACCatalog | STACCollection,
    options: {signal?: AbortSignal; maxDepth?: number; maxRequests?: number}
  ): Promise<STACCollection[]> {
    const maxDepth = options.maxDepth ?? this.options.stac?.maxDepth ?? DEFAULT_MAX_DEPTH;
    const maxRequests =
      options.maxRequests ?? this.options.stac?.maxRequests ?? DEFAULT_MAX_REQUESTS;
    validateTraversalLimit('maxDepth', maxDepth);
    validateTraversalLimit('maxRequests', maxRequests);

    const rootUrl = this.getDocumentUrl(root);
    const queue: STACTraversalEntry[] = [{url: rootUrl, depth: 0}];
    const visitedUrls = new Set<string>();
    const collections: STACCollection[] = [];
    let requestCount = 0;
    while (queue.length > 0) {
      throwIfAborted(options.signal);
      const entry = queue.shift()!;
      if (visitedUrls.has(entry.url)) {
        continue;
      }
      if (requestCount >= maxRequests) {
        throw new Error(`STAC collection traversal exceeded maxRequests (${maxRequests})`);
      }
      visitedUrls.add(entry.url);
      requestCount++;

      const object =
        entry.url === rootUrl ? root : await this.fetchObject(entry.url, options.signal);
      if (isCollection(object)) {
        collections.push(object);
      }
      if (!isCatalog(object) && !isCollection(object)) {
        continue;
      }
      if (entry.depth < maxDepth) {
        for (const link of object.links) {
          if (link.rel === 'child') {
            queue.push({
              url: resolveUrl(link.href, this.getDocumentUrl(object)),
              depth: entry.depth + 1
            });
          }
        }
      }
    }
    return collections;
  }

  /** Fetches and validates one core STAC document. */
  private async fetchObject(url: string, signal?: AbortSignal): Promise<STACObject> {
    throwIfAborted(signal);
    const response = await this.fetch(url, {signal});
    assertResponse(response, url);
    const object = validateObject(await response.json(), url);
    this.attachDocumentUrl(object, url);
    if (isItemCollection(object)) {
      for (const item of object.features) {
        this.attachDocumentUrl(item, url);
      }
    }
    return object;
  }

  /** Executes one STAC API Item Search page request. */
  private async fetchItemCollection(
    request: STACRequest,
    signal?: AbortSignal
  ): Promise<STACItemCollection> {
    const headers = new Headers(request.headers);
    let url = request.url;
    let body: string | undefined;
    if (request.method === 'POST') {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(request.body || {});
    } else if (request.body && Object.keys(request.body).length > 0) {
      url = appendQuery(url, request.body);
    }
    const response = await this.fetch(url, {method: request.method, headers, body, signal});
    assertResponse(response, url);
    const page = validateItemCollection(await response.json(), url);
    this.attachDocumentUrl(page, url);
    for (const item of page.features) {
      this.attachDocumentUrl(item, url);
    }
    return page;
  }

  /** Associates an object and its nested links with the fetched document URL. */
  private attachDocumentUrl(object: STACObject | STACCollections, url: string): void {
    this.documentUrls.set(object, url);
  }

  /** Returns the URL from which a STAC object was fetched. */
  private getDocumentUrl(object: object): string {
    return this.documentUrls.get(object) || this.url;
  }
}

/** Creates the first API Item Search request. */
function createSearchRequest(link: STACLink, baseUrl: string, query: STACSearchQuery): STACRequest {
  const {signal: _signal, ...body} = query;
  return {
    url: resolveUrl(link.href, baseUrl),
    method: link.method || 'POST',
    headers: link.headers,
    body
  };
}

/** Creates a pagination request according to the STAC API next-link fields. */
function createNextRequest(
  link: STACLink,
  baseUrl: string,
  previousRequest: STACRequest
): STACRequest {
  const linkBody = link.body || {};
  return {
    url: resolveUrl(link.href, baseUrl),
    method: link.method || previousRequest.method,
    headers: {...previousRequest.headers, ...link.headers},
    body: link.merge ? {...previousRequest.body, ...linkBody} : link.body
  };
}

/** Creates a stable pagination-cycle key for GET and POST requests. */
function getRequestKey(request: STACRequest): string {
  return `${request.method} ${request.url} ${JSON.stringify(request.body || {})}`;
}

/** Adds flat STAC Item Search parameters to a GET URL. */
function appendQuery(url: string, body: Record<string, unknown>): string {
  const parsedUrl = new URL(url);
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) {
      parsedUrl.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
  }
  return parsedUrl.href;
}

/** Resolves a possibly relative STAC link or asset URL. */
function resolveUrl(url: string, baseUrl: string): string {
  return new URL(url, baseUrl).href;
}

/** Returns the first link with a requested relation. */
function findLink(links: STACLink[], relation: string): STACLink | undefined {
  return links.find(link => link.rel === relation);
}

/** Throws a useful HTTP failure for a STAC request. */
function assertResponse(response: Response, url: string): void {
  if (!response.ok) {
    throw new Error(`STAC request failed (${response.status} ${response.statusText}): ${url}`);
  }
}

/** Validates traversal limits shared by static traversal operations. */
function validateTraversalLimit(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`STAC ${name} must be a positive integer`);
  }
}

/** Throws an abort reason before starting additional catalog work. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason || new DOMException('The operation was aborted', 'AbortError');
  }
}

/** Waits for shared work while applying cancellation only to the current caller. */
function waitForPromiseWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return promise;
  }
  throwIfAborted(signal);
  return new Promise<T>((resolve, reject) => {
    const handleAbort = (): void =>
      reject(signal.reason || new DOMException('The operation was aborted', 'AbortError'));
    signal.addEventListener('abort', handleAbort, {once: true});
    void promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', handleAbort));
  });
}

/** Validates a core STAC document while preserving extension fields. */
function validateObject(value: unknown, url: string): STACObject {
  if (!isRecord(value)) {
    throw new Error(`Invalid STAC JSON document: ${url}`);
  }
  if (value.type === 'Catalog' || value.type === 'Collection') {
    if (typeof value.id !== 'string' || !Array.isArray(value.links)) {
      throw new Error(`Invalid STAC Catalog or Collection: ${url}`);
    }
    return value as STACCatalog | STACCollection;
  }
  if (value.type === 'Feature') {
    if (typeof value.id !== 'string' || !isRecord(value.assets) || !Array.isArray(value.links)) {
      throw new Error(`Invalid STAC Item: ${url}`);
    }
    return value as STACItem;
  }
  if (value.type === 'FeatureCollection') {
    return validateItemCollection(value, url);
  }
  throw new Error(`Unsupported STAC object type at ${url}`);
}

/** Validates an Item Collection response. */
function validateItemCollection(value: unknown, url: string): STACItemCollection {
  if (
    !isRecord(value) ||
    value.type !== 'FeatureCollection' ||
    !Array.isArray(value.features) ||
    !Array.isArray(value.links)
  ) {
    throw new Error(`Invalid STAC ItemCollection: ${url}`);
  }
  for (const item of value.features) {
    if (!isItem(item)) {
      throw new Error(`Invalid STAC Item in ItemCollection: ${url}`);
    }
  }
  return value as STACItemCollection;
}

/** Validates a Collections response. */
function validateCollections(value: unknown, url: string): STACCollections {
  if (!isRecord(value) || !Array.isArray(value.collections) || !Array.isArray(value.links)) {
    throw new Error(`Invalid STAC Collections response: ${url}`);
  }
  if (!value.collections.every(isCollection)) {
    throw new Error(`Invalid Collection in STAC Collections response: ${url}`);
  }
  return value as STACCollections;
}

/** Whether a value is a STAC Catalog. */
function isCatalog(value: unknown): value is STACCatalog {
  return isRecord(value) && value.type === 'Catalog' && Array.isArray(value.links);
}

/** Whether a value is a STAC Collection. */
function isCollection(value: unknown): value is STACCollection {
  return isRecord(value) && value.type === 'Collection' && Array.isArray(value.links);
}

/** Whether a value is a STAC Item. */
function isItem(value: unknown): value is STACItem {
  return (
    isRecord(value) &&
    value.type === 'Feature' &&
    typeof value.id === 'string' &&
    isRecord(value.assets) &&
    Array.isArray(value.links)
  );
}

/** Whether a value is a STAC Item Collection. */
function isItemCollection(value: unknown): value is STACItemCollection {
  return (
    isRecord(value) &&
    value.type === 'FeatureCollection' &&
    Array.isArray(value.features) &&
    Array.isArray(value.links)
  );
}

/** Whether an unknown JSON value is an object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Applies the locally supported subset of STAC Item Search parameters. */
function matchesItem(item: STACItem, query: STACSearchQuery): boolean {
  if (query.ids && !query.ids.includes(item.id)) {
    return false;
  }
  if (query.collections && (!item.collection || !query.collections.includes(item.collection))) {
    return false;
  }
  if (query.bbox && item.bbox && !intersectsBoundingBox(query.bbox, item.bbox)) {
    return false;
  }
  return !query.datetime || intersectsDatetime(query.datetime, item);
}

/** Tests two two-dimensional projections of STAC bounding boxes for overlap. */
function intersectsBoundingBox(left: STACBoundingBox, right: STACBoundingBox): boolean {
  const leftMaximumX = left.length === 6 ? left[3] : left[2];
  const leftMaximumY = left.length === 6 ? left[4] : left[3];
  const rightMaximumX = right.length === 6 ? right[3] : right[2];
  const rightMaximumY = right.length === 6 ? right[4] : right[3];
  return !(
    leftMaximumX < right[0] ||
    rightMaximumX < left[0] ||
    leftMaximumY < right[1] ||
    rightMaximumY < left[1]
  );
}

/** Tests a STAC datetime instant or interval against an Item temporal extent. */
function intersectsDatetime(datetime: string, item: STACItem): boolean {
  const queryInterval = parseDatetimeInterval(datetime, true);
  const itemDatetime = item.properties.datetime;
  const itemInterval =
    typeof itemDatetime === 'string'
      ? parseDatetimeInterval(itemDatetime, false)
      : parseItemDatetimeInterval(item);
  if (!itemInterval) {
    return true;
  }
  return queryInterval[0] <= itemInterval[1] && itemInterval[0] <= queryInterval[1];
}

/** Parses a search datetime, optionally throwing for invalid caller input. */
function parseDatetimeInterval(
  datetime: string,
  throwOnInvalid: boolean
): readonly [number, number] {
  const parts = datetime.split('/');
  const start = parts[0] === '..' ? Number.NEGATIVE_INFINITY : Date.parse(parts[0]);
  const endPart = parts.length > 1 ? parts[1] : parts[0];
  const end = endPart === '..' ? Number.POSITIVE_INFINITY : Date.parse(endPart);
  if (parts.length > 2 || Number.isNaN(start) || Number.isNaN(end) || start > end) {
    if (throwOnInvalid) {
      throw new Error(`Invalid STAC datetime: ${datetime}`);
    }
    return [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
  }
  return [start, end];
}

/** Reads an Item start/end datetime interval when no exact datetime is present. */
function parseItemDatetimeInterval(item: STACItem): readonly [number, number] | null {
  const start = item.properties.start_datetime;
  const end = item.properties.end_datetime;
  if (!start || !end) {
    return null;
  }
  return parseDatetimeInterval(`${start}/${end}`, false);
}
