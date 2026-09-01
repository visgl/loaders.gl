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

/** Options shared by the minimal OGC API source adapters. */
export type OGCAPISourceOptions = DataSourceOptions & {
  /** Optional collection identifier for an OGC API Features source. */
  'ogc-api'?: {collectionId?: string; tileTemplate?: string};
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

  /** Fetches a page of GeoJSON features using the standard bbox parameters. */
  async getFeatures(parameters: GetFeaturesParameters): Promise<VectorSourceData> {
    const collectionId = this.getCollectionId(parameters.layers);
    const collectionURL = /\/collections\/[^/]+$/.test(this.url)
      ? `${this.url}/items`
      : `${this.getServiceURL()}/collections/${encodeURIComponent(collectionId)}/items`;
    const url = new URL(collectionURL);
    url.searchParams.set('bbox', flattenBoundingBox(parameters.boundingBox).join(','));
    if (parameters.crs) url.searchParams.set('crs', parameters.crs);
    const response = await this.fetchJSON(
      url.toString(),
      'application/geo+json, application/json;q=0.9'
    );
    if (!isFeatureCollection(response)) {
      throw new Error('OGC API Features response was not a GeoJSON FeatureCollection');
    }
    const geoJSONTable = {shape: 'geojson-table', ...response} as GeoJSONTable;
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

  /** Fetches and decodes a JSON representation from the service. */
  private async fetchJSON(url: string, accept = 'application/json'): Promise<unknown> {
    const response = await this.fetch(url, {headers: {Accept: accept}});
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
  /** Creates an OGC API Tiles source. */
  constructor(url: string, options: OGCAPISourceOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, OGCAPITilesSourceLoader.defaultOptions, coreApi);
  }

  /** Returns basic tileset metadata from the service landing page. */
  async getMetadata(): Promise<TileSourceMetadata> {
    const landingPage = (await this.fetchJSON(this.url)) as OGCAPILandingPage;
    const tileLink = landingPage.links?.find(link => link.rel?.includes('tileset'));
    return {name: landingPage.title || '', title: landingPage.title, format: tileLink?.type};
  }

  /** Fetches raw bytes for one tile from an advertised template. */
  async getTile(parameters: GetTileParameters): Promise<ArrayBuffer | null> {
    const url = this.getTileURL(parameters);
    const response = await this.fetch(url, {headers: {Accept: 'application/octet-stream'}});
    if (!response.ok) throw new Error(`OGC API Tiles request failed: ${response.status}`);
    return response.arrayBuffer();
  }

  /** Fetches a tile using the deck.gl-compatible request shape. */
  async getTileData(parameters: GetTileDataParameters): Promise<ArrayBuffer | null> {
    return this.getTile(parameters.index);
  }

  /** Expands a `{tileMatrix}`, `{tileRow}`, and `{tileCol}` template. */
  getTileURL(parameters: GetTileParameters): string {
    const template = this.options['ogc-api']?.tileTemplate;
    if (!template) throw new Error('OGC API Tiles requires ogc-api.tileTemplate');
    return template
      .replaceAll('{tileMatrix}', String(parameters.z))
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

/** Converts the loaders.gl nested bounding box into the OGC comma-separated form. */
function flattenBoundingBox(boundingBox: GetFeaturesParameters['boundingBox']): number[] {
  return [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]];
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
