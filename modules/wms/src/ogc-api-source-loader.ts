// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CoreAPI,
  DataSourceOptions,
  GetFeaturesParameters,
  GetTileDataParameters,
  GetTileParameters,
  SourceLoader,
  TileGrid,
  TileSource,
  TileSourceMetadata,
  VectorSource,
  VectorSourceData,
  VectorSourceMetadata
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {GeoJSONTable, Schema} from '@loaders.gl/schema';
import {
  convertFeaturesToWKBArrowTable,
  convertGeojsonToBinaryFeatureCollection
} from '@loaders.gl/gis';
import {getServiceCRSAxisOrder} from './crs-utils';
import type {OGCTileMatrixSet} from './lib/parsers/ogc-api/tile-matrix-set';
import {convertOGCTileMatrixSetToTileGrid} from './lib/parsers/ogc-api/tile-matrix-set';
import {getTileGridMatrixId, validateMetersPerUnit} from './lib/tile-grid';
import type {FeaturePaginationOptions, FeaturePage} from './feature-pagination';
import {
  addNextLinkHeader,
  collectFeaturePages,
  getPaginationOptions,
  iterateFeaturePages
} from './feature-pagination';

/** Options shared by the minimal OGC API source adapters. */
export type OGCAPISourceOptions = DataSourceOptions & {
  /** Optional collection identifier for an OGC API Features source. */
  'ogc-api'?: {
    /** Collection to query. */
    collectionId?: string;
    /** Explicit tile template for the tiles adapter. */
    tileTemplate?: string;
    /**
     * Tile matrix set for the tiles adapter, as an OGC TileMatrixSet 2.0 document or the URL of
     * one. When set, `getMetadata()` reports it as `tileGrid`. When omitted, the tile matrix set
     * is discovered from the tileset that `tileTemplate` belongs to.
     */
    tileMatrixSet?: OGCTileMatrixSet | string;
    /** Length of one CRS unit in meters, for a tile matrix set given by scale denominators. */
    metersPerUnit?: number | null;
    /** Opt-in bounded pagination for getFeatures(); omitted keeps the single-page behavior. */
    pagination?: FeaturePaginationOptions;
  };
};

/** A small representation of an OGC API link. */
export type OGCAPILink = {href: string; rel?: string; type?: string; title?: string};

/** A minimal OGC API collection description. */
export type OGCAPICollection = {
  id: string;
  title?: string;
  description?: string;
  extent?: {spatial?: {bbox?: number[][]}; temporal?: unknown};
  crs?: string[];
  links?: OGCAPILink[];
};

/**
 * The fields of OGC API Tiles tileset metadata used to find its tile matrix set. Other fields,
 * including `tileMatrixSetLimits`, are kept but not interpreted.
 */
export type OGCAPITileset = {
  title?: string;
  /** Identifier of the tile matrix set in this API's `/tileMatrixSets`. */
  tileMatrixSetId?: string;
  /** Registry URI of the tile matrix set. */
  tileMatrixSetURI?: string;
  /** Includes the `http://www.opengis.net/def/rel/ogc/1.0/tiling-scheme` link. */
  links?: OGCAPILink[];
  [key: string]: unknown;
};

/** One entry of an OGC API Tiles `/tileMatrixSets` list. */
export type OGCAPITileMatrixSetSummary = {
  id: string;
  title?: string;
  /** Registry URI of the tile matrix set. */
  uri?: string;
  links?: OGCAPILink[];
};

/** The normalized landing page returned by an OGC API service. */
export type OGCAPILandingPage = {
  title?: string;
  description?: string;
  links?: OGCAPILink[];
};

/** Minimal OGC API Features source. */
export class OGCAPIFeaturesSource
  extends DataSource<string, OGCAPISourceOptions>
  implements VectorSource
{
  /** Creates an OGC API Features source. */
  constructor(url: string, options: OGCAPISourceOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, OGCAPIFeaturesSourceLoader.defaultOptions, coreApi);
  }

  /** Returns the landing page metadata. */
  async getLandingPage(): Promise<OGCAPILandingPage> {
    return (await this.fetchJSON(this.getServiceURL())) as OGCAPILandingPage;
  }

  /** Lists the feature collections advertised by the service. */
  async getCollections(): Promise<OGCAPICollection[]> {
    const response = (await this.fetchJSON(`${this.getServiceURL()}/collections`)) as {
      collections?: OGCAPICollection[];
    };
    return response.collections || [];
  }

  /** Returns normalized metadata for the selected collection. */
  async getMetadata(): Promise<VectorSourceMetadata> {
    const collections = await this.getCollections();
    const collection = this.getCollection(collections);
    return {
      name: collection?.id || this.getCollectionId(),
      title: collection?.title,
      abstract: collection?.description,
      keywords: [],
      layers: collection ? [toVectorLayer(collection)] : []
    };
  }

  /** Returns a minimal schema; OGC API schema extensions remain optional. */
  async getSchema(): Promise<Schema> {
    return {fields: [], metadata: {}};
  }

  /** Fetches one page, or gathers advertised pages when ogc-api.pagination is configured. */
  async getFeatures(parameters: GetFeaturesParameters): Promise<VectorSourceData> {
    const geoJSONTable = this.options['ogc-api']?.pagination
      ? await collectFeaturePages(this.getFeaturesInPages(parameters))
      : (await this.fetchFeaturePage(this.getFeaturesURL(parameters), parameters.signal)).table;
    switch (parameters.format || 'geojson') {
      case 'binary':
        return convertGeojsonToBinaryFeatureCollection(geoJSONTable.features);
      case 'arrow':
        return convertFeaturesToWKBArrowTable(geoJSONTable.features, {
          encodingPreference: parameters.geoarrow?.encodingPreference
        });
      case 'geojson':
      default:
        return geoJSONTable;
    }
  }

  /**
   * Yields GeoJSON pages by following advertised body or HTTP-header next links.
   * Does not invent offset parameters. Page requests are sequential and independently bounded.
   * Unknown totals remain unknown, so managed coverage still requires count evidence.
   */
  getFeaturesInPages(
    parameters: GetFeaturesParameters,
    options: FeaturePaginationOptions = this.options['ogc-api']?.pagination || {}
  ): AsyncIterable<GeoJSONTable> {
    const limits = getPaginationOptions(options);
    const url = new URL(this.getFeaturesURL(parameters));
    url.searchParams.set('limit', String(limits.pageSize));
    return iterateFeaturePages(
      url.toString(),
      pageURL => this.fetchFeaturePage(pageURL, parameters.signal),
      limits,
      parameters.signal,
      (_url, _table, featureCount, matched) => {
        if (matched !== undefined && featureCount < matched)
          throw new Error(
            'OGC API Features pagination ended before numberMatched without a next link'
          );
        return undefined;
      }
    );
  }

  /** Builds a bounded items URL, preserving endpoint query parameters. */
  private getFeaturesURL(parameters: GetFeaturesParameters): string {
    const url = new URL(this.url);
    const collectionId = this.getCollectionId(parameters.layers);
    url.pathname = /\/collections\/[^/]+\/?$/.test(url.pathname)
      ? `${url.pathname.replace(/\/$/, '')}/items`
      : `${url.pathname.replace(/\/$/, '')}/collections/${encodeURIComponent(collectionId)}/items`;
    const requestCrs = parameters.requestCrs || parameters.crs;
    url.searchParams.set('bbox', flattenBoundingBox(parameters.boundingBox, requestCrs).join(','));
    if (parameters.crs) url.searchParams.set('crs', parameters.crs);
    if (requestCrs) url.searchParams.set('bbox-crs', requestCrs);
    return url.toString();
  }

  /** Fetches one validated page, retaining body links and HTTP Link-header pagination. */
  private async fetchFeaturePage(url: string, signal?: AbortSignal): Promise<FeaturePage> {
    const response = await this.fetch(url, {
      headers: {Accept: 'application/geo+json, application/json;q=0.9'},
      signal
    });
    if (!response.ok) throw new Error(`OGC API request failed: ${response.status}`);
    const json = await response.json();
    if (!isFeatureCollection(json) || !Array.isArray(json.features))
      throw new Error('OGC API Features response was not a GeoJSON FeatureCollection');
    return {
      table: addNextLinkHeader(
        {shape: 'geojson-table', ...json} as GeoJSONTable,
        response.headers.get('link')
      ),
      url: response.url || url
    };
  }

  /** Fetches and decodes a JSON representation from the service. */
  private async fetchJSON(
    url: string,
    accept = 'application/json',
    signal?: AbortSignal
  ): Promise<unknown> {
    const response = await this.fetch(url, {headers: {Accept: accept}, signal});
    if (!response.ok) throw new Error(`OGC API request failed: ${response.status}`);
    return response.json();
  }

  /** Selects the requested collection from a collections response. */
  private getCollection(collections: OGCAPICollection[]): OGCAPICollection | undefined {
    const collectionId = this.getCollectionId();
    return collections.find(collection => collection.id === collectionId) || collections[0];
  }

  /** Returns the configured collection identifier or the first URL collection segment. */
  private getCollectionId(layers?: string | string[]): string {
    const configuredId = this.options['ogc-api']?.collectionId;
    const layerId = Array.isArray(layers) ? layers[0] : layers;
    if (configuredId || layerId) return configuredId || layerId!;
    const match = this.url.match(/\/collections\/([^/]+)/);
    if (match) return decodeURIComponent(match[1]);
    return '';
  }

  /** Returns the service root for both landing-page and collection URLs. */
  private getServiceURL(): string {
    return this.url.replace(/\/collections\/[^/]+$/, '');
  }
}

/** Source loader for minimal OGC API Features support. */
export const OGCAPIFeaturesSourceLoader = {
  dataType: null as unknown as OGCAPIFeaturesSource,
  batchType: null as never,
  name: 'OGC API Features',
  id: 'ogc-api-features',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: ['application/geo+json'],
  type: 'ogc-api-features',
  fromUrl: true,
  fromBlob: false,
  options: {'ogc-api': {}},
  defaultOptions: {'ogc-api': {}},
  testURL: (url: string): boolean => /\/collections(?:\/|$)|ogc[/-]?api[/-]features/i.test(url),
  createDataSource: (url: string, options: OGCAPISourceOptions = {}, coreApi?: CoreAPI) =>
    new OGCAPIFeaturesSource(url, options, coreApi)
} as const satisfies SourceLoader<OGCAPIFeaturesSource>;

/** Minimal OGC API Tiles source that follows a discovered tile template. */
export class OGCAPITilesSource
  extends DataSource<string, OGCAPISourceOptions>
  implements TileSource
{
  /** Converted tile matrix set and the options it was loaded or discovered with. */
  private _tileGridCache: {
    tileMatrixSet: OGCTileMatrixSet | string | undefined;
    metersPerUnit: number | null | undefined;
    /** Template the matrix set was discovered from; undefined when it is configured. */
    tileTemplate: string | undefined;
    promise: Promise<TileGrid | undefined>;
    /** The converted grid, once available. */
    tileGrid?: TileGrid;
    /** Set when discovery failed; `getMetadata()` then tries again. */
    discoveryFailed?: boolean;
  } | null = null;

  /** Creates an OGC API Tiles source. */
  constructor(url: string, options: OGCAPISourceOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, OGCAPITilesSourceLoader.defaultOptions, coreApi);
    validateMetersPerUnit(options['ogc-api']?.metersPerUnit, 'OGC API Tiles');
  }

  /** Updates options. A new `tileMatrixSet` document replaces the old one instead of merging. */
  override setProps(options: OGCAPISourceOptions): void {
    super.setProps(options);
    const ogcAPIOptions = options['ogc-api'];
    if (ogcAPIOptions && 'tileMatrixSet' in ogcAPIOptions) {
      this.options['ogc-api'] = {
        ...this.options['ogc-api'],
        tileMatrixSet: ogcAPIOptions.tileMatrixSet
      };
    }
  }

  /** Returns basic tileset metadata from the service landing page and configured matrix set. */
  async getMetadata(): Promise<TileSourceMetadata> {
    const [landingPage, tileGrid] = await Promise.all([
      this.fetchJSON(this.url) as Promise<OGCAPILandingPage>,
      this.getTileGrid({retryDiscovery: true})
    ]);
    const tileLink = landingPage.links?.find(link => link.rel?.includes('tileset'));
    return {
      name: landingPage.title || '',
      title: landingPage.title,
      format: tileLink?.type,
      ...(tileGrid ? {tileGrid} : {})
    };
  }

  /** Lists the tile matrix sets the API advertises at `/tileMatrixSets`. */
  async getTileMatrixSets(): Promise<OGCAPITileMatrixSetSummary[]> {
    const response = (await this.fetchJSON(resolveLink('tileMatrixSets', this.url))) as {
      tileMatrixSets?: OGCAPITileMatrixSetSummary[];
    };
    return Array.isArray(response?.tileMatrixSets) ? response.tileMatrixSets : [];
  }

  /** Fetches one tile matrix set from `/tileMatrixSets/{tileMatrixSetId}`. */
  async getTileMatrixSet(tileMatrixSetId: string): Promise<OGCTileMatrixSet> {
    return (await this.fetchJSON(this.getTileMatrixSetIdURL(tileMatrixSetId))) as OGCTileMatrixSet;
  }

  /** Returns the URL of `/tileMatrixSets/{tileMatrixSetId}`. */
  private getTileMatrixSetIdURL(tileMatrixSetId: string): string {
    return resolveLink(`tileMatrixSets/${encodeURIComponent(tileMatrixSetId)}`, this.url);
  }

  /**
   * Returns the configured or discovered tile matrix set as a tile grid. The result is reused until
   * the options change. A failed configured load is retried on the next call; a failed discovery
   * is reported and retried only when `retryDiscovery` is set, so tile requests do not repeat it.
   */
  private getTileGrid({retryDiscovery = false} = {}): Promise<TileGrid | undefined> {
    const key = this.getTileGridKey();
    const cache = this._tileGridCache;
    if (cache && isSameTileGridKey(cache, key) && !(retryDiscovery && cache.discoveryFailed)) {
      return cache.promise;
    }
    const newCache: NonNullable<OGCAPITilesSource['_tileGridCache']> = {
      ...key,
      promise: Promise.resolve(undefined)
    };
    const {tileMatrixSet, metersPerUnit, tileTemplate} = key;
    newCache.promise = tileMatrixSet
      ? this.loadTileGrid(tileMatrixSet, metersPerUnit)
      : this.discoverTileGrid(tileTemplate, metersPerUnit).catch(error => {
          newCache.discoveryFailed = true;
          this.reportError(
            new Error(
              `OGC API Tiles could not discover the tile matrix set: ${(error as Error)?.message}`
            ),
            'OGC API Tiles could not discover the tile matrix set'
          );
          return undefined;
        });
    this._tileGridCache = newCache;
    newCache.promise.then(
      tileGrid => {
        newCache.tileGrid = tileGrid;
      },
      () => {
        if (this._tileGridCache === newCache) this._tileGridCache = null;
      }
    );
    return newCache.promise;
  }

  /** The options a tile grid depends on. A configured matrix set disables discovery. */
  private getTileGridKey() {
    const {tileMatrixSet, metersPerUnit, tileTemplate} = this.options['ogc-api'] || {};
    return {tileMatrixSet, metersPerUnit, tileTemplate: tileMatrixSet ? undefined : tileTemplate};
  }

  /**
   * Discovers the tile matrix set of the tileset that a `{tileMatrix}` template belongs to. The
   * tileset metadata is the template path before `/{tileMatrix}`, as OGC API Tiles lays out tile
   * resources. Its tiling-scheme link is followed; otherwise `tileMatrixSetId` is looked up in
   * `/tileMatrixSets`, and a `tileMatrixSetURI` is matched against the `/tileMatrixSets` list.
   * Resolves to undefined when the template has no `{tileMatrix}`, and rejects when the tileset
   * or its tile matrix set cannot be loaded.
   */
  private async discoverTileGrid(
    tileTemplate: string | undefined,
    metersPerUnit: number | null | undefined
  ): Promise<TileGrid | undefined> {
    // Find the tileset path before resolving, since URL parsing may percent-encode the braces.
    const tilesetPath = tileTemplate && getTilesetURL(tileTemplate);
    if (!tilesetPath) return undefined;
    const tilesetUrl = resolveLink(tilesetPath, this.url);
    const tileset = (await this.fetchJSON(tilesetUrl)) as OGCAPITileset;
    const tileMatrixSetUrl = await this.getTileMatrixSetURL(tileset, tilesetUrl);
    const document = (await this.fetchJSON(tileMatrixSetUrl)) as OGCTileMatrixSet;
    return convertOGCTileMatrixSetToTileGrid(document, {metersPerUnit});
  }

  /** Returns the URL of the tile matrix set a tileset uses. */
  private async getTileMatrixSetURL(tileset: OGCAPITileset, tilesetUrl: string): Promise<string> {
    const link = findJSONLink(tileset?.links, isTilingSchemeRel);
    if (link) return resolveDocumentLink(link.href, tilesetUrl);
    if (typeof tileset?.tileMatrixSetId === 'string' && tileset.tileMatrixSetId) {
      return this.getTileMatrixSetIdURL(tileset.tileMatrixSetId);
    }
    if (typeof tileset?.tileMatrixSetURI === 'string' && tileset.tileMatrixSetURI) {
      const listUrl = resolveLink('tileMatrixSets', this.url);
      const summary = (await this.getTileMatrixSets()).find(
        candidate => candidate.uri === tileset.tileMatrixSetURI
      );
      const selfLink = findJSONLink(summary?.links, rel => rel === 'self');
      if (selfLink) return resolveDocumentLink(selfLink.href, listUrl);
      if (summary?.id) return this.getTileMatrixSetIdURL(summary.id);
      throw new Error(`${tileset.tileMatrixSetURI} is not listed in ${listUrl}`);
    }
    throw new Error(`${tilesetUrl} names no tile matrix set`);
  }

  /**
   * Returns the tile grid if it is available without waiting: an inline document is converted
   * immediately, while a document given as a URL or discovered is available once loaded.
   */
  private getLoadedTileGrid(): TileGrid | undefined {
    const tileMatrixSet = this.options['ogc-api']?.tileMatrixSet;
    const cache = this._tileGridCache;
    if (cache?.tileGrid && isSameTileGridKey(cache, this.getTileGridKey())) return cache.tileGrid;
    if (tileMatrixSet && typeof tileMatrixSet !== 'string') {
      return convertOGCTileMatrixSetToTileGrid(tileMatrixSet, {
        metersPerUnit: this.options['ogc-api']?.metersPerUnit
      });
    }
    return undefined;
  }

  /** Converts a tile matrix set, fetching it first when given as a URL. */
  private async loadTileGrid(
    tileMatrixSet: OGCTileMatrixSet | string | undefined,
    metersPerUnit: number | null | undefined
  ): Promise<TileGrid | undefined> {
    if (!tileMatrixSet) return undefined;
    const document =
      typeof tileMatrixSet === 'string'
        ? ((await this.fetchJSON(resolveLink(tileMatrixSet, this.url))) as OGCTileMatrixSet)
        : tileMatrixSet;
    return convertOGCTileMatrixSetToTileGrid(document, {metersPerUnit});
  }

  /** Fetches raw bytes for one tile from an advertised template. */
  async getTile(parameters: GetTileParameters): Promise<ArrayBuffer | null> {
    // The matrix identifier in the URL comes from the configured or discovered tile matrix set.
    await this.getTileGrid();
    const url = this.getTileURL(parameters);
    const response = await this.fetch(url, {headers: {Accept: 'application/octet-stream'}});
    if (!response.ok) throw new Error(`OGC API Tiles request failed: ${response.status}`);
    return response.arrayBuffer();
  }

  /** Fetches a tile using the deck.gl-compatible request shape. */
  async getTileData(parameters: GetTileDataParameters): Promise<ArrayBuffer | null> {
    return this.getTile(parameters.index);
  }

  /**
   * Expands a `{tileMatrix}`, `{tileRow}`, and `{tileCol}` template. `{tileMatrix}` is
   * `parameters.tileMatrix` when given, otherwise the identifier of the configured matrix whose id
   * equals `z`, otherwise the matrix at index `z`. With a loaded tile matrix set, a matrix it does
   * not contain throws a `RangeError`; without one, `{tileMatrix}` is the explicit identifier or
   * `z`. `{z}` is always the number.
   */
  getTileURL(parameters: GetTileParameters): string {
    const template = this.options['ogc-api']?.tileTemplate;
    if (!template) throw new Error('OGC API Tiles requires ogc-api.tileTemplate');
    // XYZ-only templates do not address a matrix, so no matrix is looked up for them.
    const tileMatrixId = template.includes('{tileMatrix}')
      ? getTileGridMatrixId(this.getLoadedTileGrid(), parameters)
      : '';
    return template
      .replaceAll('{tileMatrix}', tileMatrixId)
      .replaceAll('{tileRow}', String(parameters.y))
      .replaceAll('{tileCol}', String(parameters.x))
      .replaceAll('{z}', String(parameters.z))
      .replaceAll('{y}', String(parameters.y))
      .replaceAll('{x}', String(parameters.x));
  }

  private async fetchJSON(url: string): Promise<unknown> {
    const response = await this.fetch(url, {headers: {Accept: 'application/json'}});
    if (!response.ok) throw new Error(`OGC API request failed: ${response.status}`);
    return response.json();
  }
}

/** Source loader for minimal OGC API Tiles support. */
export const OGCAPITilesSourceLoader = {
  dataType: null as unknown as OGCAPITilesSource,
  batchType: null as never,
  name: 'OGC API Tiles',
  id: 'ogc-api-tiles',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'ogc-api-tiles',
  fromUrl: true,
  fromBlob: false,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\/tiles(?:\/|$)|ogc[/-]?api[/-]tiles/i.test(url),
  createDataSource: (url: string, options: OGCAPISourceOptions = {}, coreApi?: CoreAPI) =>
    new OGCAPITilesSource(url, options, coreApi)
} as const satisfies SourceLoader<OGCAPITilesSource>;

/**
 * Resolves a link against a landing page treated as a directory, so `tileMatrixSets/x` under
 * `https://host/api` becomes `https://host/api/tileMatrixSets/x`. Absolute links are returned
 * unchanged, and a relative landing page stays relative.
 */
function resolveLink(link: string, landingPageUrl: string): string {
  return resolveDocumentLink(link, landingPageUrl, true);
}

/**
 * Resolves a link found in a document against the document URL, as browsers do. With
 * `asDirectory`, the URL is treated as a directory. A relative document URL stays relative.
 */
function resolveDocumentLink(link: string, documentUrl: string, asDirectory = false): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(link)) return link;
  const placeholderOrigin = 'http://placeholder.invalid';
  const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(documentUrl);
  const base = new URL(documentUrl, `${placeholderOrigin}/`);
  if (asDirectory && !base.pathname.endsWith('/')) base.pathname += '/';
  const resolved = new URL(link, base);
  return isAbsolute ? resolved.href : resolved.href.slice(placeholderOrigin.length);
}

/**
 * Returns the tileset metadata URL for an OGC tile template: the path before `/{tileMatrix}`,
 * keeping query parameters other than the `f` format selector. Undefined for other templates.
 */
function getTilesetURL(tileTemplate: string): string | undefined {
  const index = tileTemplate.indexOf('/{tileMatrix}');
  if (index < 0) return undefined;
  const queryIndex = tileTemplate.indexOf('?', index);
  const query = new URLSearchParams(queryIndex < 0 ? '' : tileTemplate.slice(queryIndex + 1));
  query.delete('f');
  const queryString = query.toString();
  return tileTemplate.slice(0, index) + (queryString ? `?${queryString}` : '');
}

/** The current and legacy link relations from a tileset to its tile matrix set. */
function isTilingSchemeRel(rel: string): boolean {
  return rel === 'http://www.opengis.net/def/rel/ogc/1.0/tiling-scheme' || rel === 'tiling-scheme';
}

/** Returns the matching link with a JSON media type, otherwise the first one without a type. */
function findJSONLink(
  links: OGCAPILink[] | undefined,
  matchesRel: (rel: string) => boolean
): OGCAPILink | undefined {
  const candidates = (Array.isArray(links) ? links : []).filter(
    link => typeof link?.href === 'string' && typeof link.rel === 'string' && matchesRel(link.rel)
  );
  return (
    candidates.find(link => /^application\/([\w.-]+\+)?json\b/i.test(link.type || '')) ||
    candidates.find(link => !link.type)
  );
}

/** Tests whether a cached tile grid was loaded with these options. */
function isSameTileGridKey(
  a: {tileMatrixSet: unknown; metersPerUnit: unknown; tileTemplate: unknown},
  b: {tileMatrixSet: unknown; metersPerUnit: unknown; tileTemplate: unknown}
): boolean {
  return (
    a.tileMatrixSet === b.tileMatrixSet &&
    a.metersPerUnit === b.metersPerUnit &&
    a.tileTemplate === b.tileTemplate
  );
}

/** Converts the loaders.gl nested bounding box into the OGC comma-separated form. */
function flattenBoundingBox(
  boundingBox: GetFeaturesParameters['boundingBox'],
  requestCrs?: GetFeaturesParameters['requestCrs']
): number[] {
  const values = [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]];
  if (getServiceCRSAxisOrder(requestCrs) === 'yx') {
    return [values[1], values[0], values[3], values[2]];
  }
  return values;
}

/** Checks that a decoded response has the required GeoJSON feature-collection marker. */
function isFeatureCollection(value: unknown): value is Pick<GeoJSONTable, 'type' | 'features'> {
  return Boolean(value && typeof value === 'object' && (value as any).type === 'FeatureCollection');
}

/** Converts an OGC collection extent into the normalized source-layer shape. */
function toVectorLayer(collection: OGCAPICollection) {
  const bbox = collection.extent?.spatial?.bbox?.[0];
  return {
    name: collection.id,
    title: collection.title,
    crs: collection.crs,
    boundingBox: bbox
      ? ([
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]]
        ] as [[number, number], [number, number]])
      : undefined,
    layers: []
  };
}
