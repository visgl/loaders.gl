// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';
import type {
  CoreAPI,
  DataSourceOptions,
  GetTileDataParameters,
  GetTileParameters,
  SourceLoader,
  TileSource,
  TileSourceMetadata
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

/** Options for an ArcGIS cached MapServer tile source. */
export type ArcGISMapTileSourceLoaderOptions = DataSourceOptions & {
  'arcgis-map-server'?: {
    /** Select cached tiles, dynamic export tiles, or automatic metadata-based selection. */
    mode?: 'cached' | 'dynamic' | 'auto';
    /** Tile size used for dynamic export requests. */
    tileSize?: number;
    /** Optional custom tile URL template. */
    urlTemplate?: string;
    /** Optional service URL pool for simple request distribution. */
    urls?: string[];
    /** Additional query parameters sent to the metadata endpoint. */
    parameters?: Record<string, string>;
    /** Metadata document supplied by the application. */
    metadata?: ArcGISMapServerMetadata;
    /** Default parameters forwarded to MapServer `export` requests. */
    exportParameters?: Record<string, string | number | boolean>;
  };
};

/** Relevant normalized fields from an ArcGIS MapServer metadata document. */
export type ArcGISMapServerMetadata = {
  name?: string;
  description?: string;
  serviceDescription?: string;
  copyrightText?: string;
  fullExtent?: {xmin: number; ymin: number; xmax: number; ymax: number; spatialReference?: unknown};
  spatialReference?: unknown;
  tileInfo?: {
    lods?: {level: number}[];
    rows?: number;
    cols?: number;
    format?: string;
    spatialReference?: unknown;
    origin?: {x: number; y: number};
  };
};

/** Parameters that can be changed between ArcGIS map tile requests. */
export type ArcGISMapTileParameters = Record<string, string | number | boolean>;

/** ArcGIS MapServer source for cached `/tile/{z}/{y}/{x}` image tiles. */
export class ArcGISMapTileSource
  extends DataSource<string, ArcGISMapTileSourceLoaderOptions>
  implements TileSource
{
  /** MIME type rendered by the generic deck.gl tile adapter. */
  readonly mimeType = 'image/png';

  /** Cached service metadata. */
  private _metadata: ArcGISMapServerMetadata | null = null;
  /** In-flight metadata request shared by concurrent callers. */
  private _metadataPromise: Promise<ArcGISMapServerMetadata> | null = null;
  /** Parameters applied to subsequent dynamic exports. */
  private _runtimeParameters: ArcGISMapTileParameters = {};

  /** Creates an ArcGIS MapServer tile source. */
  constructor(url: string, options: ArcGISMapTileSourceLoaderOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, ArcGISMapTileSourceLoader.defaultOptions, coreApi);
    this.getTileData = this.getTileData.bind(this);
  }

  /** Loads and normalizes ArcGIS service metadata. */
  async getMetadata(): Promise<TileSourceMetadata> {
    const metadata = await this._getMetadata();
    const extent = metadata.fullExtent;
    const spatialReference = metadata.spatialReference || extent?.spatialReference;
    const spatialReferenceWkid = (spatialReference as {wkid?: number} | undefined)?.wkid;
    return {
      name: metadata.name || '',
      title: metadata.name || '',
      abstract: metadata.description || metadata.serviceDescription || '',
      attributions: metadata.copyrightText ? [metadata.copyrightText] : undefined,
      minZoom: 0,
      maxZoom: metadata.tileInfo?.lods?.length
        ? Math.max(...metadata.tileInfo.lods.map(lod => lod.level))
        : undefined,
      boundingBox: extent
        ? [
            [extent.xmin, extent.ymin],
            [extent.xmax, extent.ymax]
          ]
        : undefined,
      layer: {
        name: metadata.name || '',
        srs: spatialReferenceWkid ? [`EPSG:${spatialReferenceWkid}`] : [],
        layers: []
      }
    };
  }

  /** Fetches and decodes one cached ArcGIS tile. */
  async getTile(parameters: GetTileParameters, signal?: AbortSignal): Promise<ImageType | null> {
    const options = this.options['arcgis-map-server'] || {};
    const mode = options.mode || 'auto';
    const metadata = mode === 'auto' ? await this._getMetadata() : null;
    const useCachedTiles = mode === 'cached' || (mode === 'auto' && isCompatibleCache(metadata));
    const tileURL = useCachedTiles
      ? this.getTileURL(parameters)
      : this.getExportTileURL(parameters, options.tileSize || 256);
    const response = await this.fetch(tileURL, signal ? {signal} : undefined);
    if (!response.ok) {
      throw new Error(
        `ArcGIS MapServer tile request failed: ${response.status} ${response.statusText}`
      );
    }
    return (await this.coreApi.parse(
      await response.arrayBuffer(),
      ImageLoader,
      this.loadOptions
    )) as ImageType;
  }

  /** Fetches a tile using the deck.gl-compatible request shape. */
  async getTileData(parameters: GetTileDataParameters): Promise<ImageType | null> {
    return this.getTile(parameters.index, parameters.signal);
  }

  /** Builds the standard ArcGIS cached tile URL. */
  getTileURL(parameters: GetTileParameters): string {
    const template = this.options['arcgis-map-server']?.urlTemplate;
    if (template) {
      const templateURL = new URL(
        template
          .replaceAll('{z}', String(parameters.z))
          .replaceAll('{y}', String(parameters.y))
          .replaceAll('{x}', String(parameters.x))
      );
      return templateURL.toString();
    }
    const url = new URL(this.getServiceURL(parameters));
    url.pathname = `${url.pathname.replace(/\/$/, '')}/tile/${parameters.z}/${parameters.y}/${parameters.x}`;
    return url.toString();
  }

  /** Updates parameters applied to subsequent dynamic MapServer export requests. */
  updateParameters(parameters: ArcGISMapTileParameters): void {
    this._runtimeParameters = {...this._runtimeParameters, ...parameters};
  }

  /** Builds a dynamic MapServer `export` request for one web-mercator tile. */
  getExportTileURL(parameters: GetTileParameters, tileSize?: number): string {
    const options = this.options['arcgis-map-server'] || {};
    const resolvedTileSize = tileSize || options.tileSize || 256;
    const [west, south, east, north] = getWebMercatorTileBounds(parameters);
    const url = new URL(this.getServiceURL(parameters));
    url.pathname = `${url.pathname.replace(/\/$/, '')}/export`;
    const searchParameters: ArcGISMapTileParameters = {
      f: 'image',
      bbox: `${west},${south},${east},${north}`,
      bboxSR: 3857,
      imageSR: 3857,
      size: `${resolvedTileSize},${resolvedTileSize}`,
      format: 'png32',
      transparent: true,
      ...options.exportParameters,
      ...this._runtimeParameters
    };
    for (const [key, value] of Object.entries(searchParameters)) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  /** Fetches the MapServer metadata document and applies configured parameters. */
  private async _loadMetadata(): Promise<ArcGISMapServerMetadata> {
    const configuredMetadata = this.options['arcgis-map-server']?.metadata;
    if (configuredMetadata) return configuredMetadata;
    const url = new URL(this.url);
    url.searchParams.set('f', 'pjson');
    for (const [key, value] of Object.entries(
      this.options['arcgis-map-server']?.parameters || {}
    )) {
      url.searchParams.set(key, value);
    }
    const response = await this.fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `ArcGIS MapServer metadata request failed: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }

  /** Returns cached metadata and shares a single request among concurrent callers. */
  private async _getMetadata(): Promise<ArcGISMapServerMetadata> {
    if (this._metadata) return this._metadata;
    if (!this._metadataPromise) {
      this._metadataPromise = this._loadMetadata();
    }
    try {
      const metadata = await this._metadataPromise;
      this._metadata = metadata;
      return metadata;
    } finally {
      this._metadataPromise = null;
    }
  }

  /** Selects a service endpoint for a tile using a stable URL-pool mapping. */
  private getServiceURL(parameters: GetTileParameters): string {
    const urls = this.options['arcgis-map-server']?.urls;
    return urls?.length ? urls[(parameters.x + parameters.y) % urls.length] : this.url;
  }
}

function isCompatibleCache(metadata: ArcGISMapServerMetadata | null): boolean {
  const tileInfo = metadata?.tileInfo;
  if (!tileInfo || tileInfo.rows !== 256 || tileInfo.cols !== 256) return false;
  const spatialReference = tileInfo.spatialReference || metadata?.spatialReference;
  const wkid = (spatialReference as {wkid?: number; latestWkid?: number} | undefined)?.wkid;
  if (wkid !== 3857 && wkid !== 102100 && wkid !== 102113) return false;
  const origin = tileInfo.origin;
  return (
    !origin ||
    (Math.abs(origin.x + 20037508.342789244) < 1 && Math.abs(origin.y - 20037508.342789244) < 1)
  );
}

/** Calculates the Web Mercator extent represented by an XYZ tile. */
function getWebMercatorTileBounds(parameters: GetTileParameters): [number, number, number, number] {
  const worldSize = 20037508.342789244;
  const tileCount = 2 ** parameters.z;
  const tileSize = (worldSize * 2) / tileCount;
  const west = -worldSize + parameters.x * tileSize;
  const east = west + tileSize;
  const north = worldSize - parameters.y * tileSize;
  const south = north - tileSize;
  return [west, south, east, north];
}

/** Source loader for ArcGIS cached MapServer tiles. */
export const ArcGISMapTileSourceLoader = {
  dataType: null as unknown as ArcGISMapTileSource,
  batchType: null as never,
  name: 'ArcGIS MapServer tiles',
  id: 'arcgis-map-server',
  module: 'services',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-map-server',
  fromUrl: true,
  fromBlob: false,
  options: {'arcgis-map-server': {}},
  defaultOptions: {'arcgis-map-server': {}},
  testURL: (url: string): boolean =>
    /mapserver/i.test(url) && !/imageserver|featureserver/i.test(url),
  createDataSource: (
    url: string,
    options: ArcGISMapTileSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) => new ArcGISMapTileSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISMapTileSource>;
