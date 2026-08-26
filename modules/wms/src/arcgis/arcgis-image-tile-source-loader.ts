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
import type {LERCData} from '@loaders.gl/lerc';
import {LERCLoader} from '@loaders.gl/lerc';

/** Options for the ArcGIS ImageServer tile source. */
export type ArcGISImageTileSourceLoaderOptions = DataSourceOptions & {
  'arcgis-image-server-tiles'?: {
    /** Tile size used for exportImage requests. */
    tileSize?: number;
    /** Optional service URL pool for simple request distribution. */
    urls?: string[];
    /** Additional exportImage parameters. */
    parameters?: Record<string, string | number | boolean>;
    /** Response format, using LERC for analytical raster tiles. */
    format?: 'png32' | 'lerc';
  };
};

/** A tile source that renders ArcGIS ImageServer exports as deck.gl tiles. */
export class ArcGISImageTileSource
  extends DataSource<string, ArcGISImageTileSourceLoaderOptions>
  implements TileSource
{
  /** MIME type rendered by the generic deck.gl tile adapter. */
  readonly mimeType = 'image/png';

  /** Cached ImageServer metadata. */
  private _metadata: any | null = null;
  /** In-flight metadata request shared by concurrent callers. */
  private _metadataPromise: Promise<any> | null = null;
  /** Parameters applied to subsequent export requests. */
  private _runtimeParameters: Record<string, string | number | boolean> = {};

  /** Creates an ArcGIS ImageServer tile source. */
  constructor(url: string, options: ArcGISImageTileSourceLoaderOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, ArcGISImageTileSourceLoader.defaultOptions, coreApi);
    this.getTileData = this.getTileData.bind(this);
  }

  /** Returns normalized ImageServer metadata. */
  async getMetadata(): Promise<TileSourceMetadata> {
    const metadata = await this._getMetadata();
    const extent = metadata.fullExtent || metadata.extent;
    const spatialReference = metadata.spatialReference || extent?.spatialReference;
    return {
      name: metadata.name || metadata.serviceDescription || '',
      title: metadata.name || metadata.serviceDescription || '',
      abstract: metadata.description || metadata.serviceDescription || '',
      attributions: metadata.copyrightText ? [metadata.copyrightText] : undefined,
      boundingBox: extent
        ? [
            [extent.xmin, extent.ymin],
            [extent.xmax, extent.ymax]
          ]
        : undefined,
      layer: {
        name: metadata.name || '',
        srs: spatialReference?.wkid ? [`EPSG:${spatialReference.wkid}`] : [],
        layers: []
      }
    };
  }

  /** Fetches one ImageServer export tile. */
  async getTile(
    parameters: GetTileParameters,
    signal?: AbortSignal
  ): Promise<ImageType | LERCData | null> {
    const response = await this.fetch(this.getTileURL(parameters), signal ? {signal} : undefined);
    if (!response.ok) {
      throw new Error(
        `ArcGIS ImageServer tile request failed: ${response.status} ${response.statusText}`
      );
    }
    const loader =
      this.options['arcgis-image-server-tiles']?.format === 'lerc' ? LERCLoader : ImageLoader;
    return (await this.coreApi.parse(
      await response.arrayBuffer(),
      loader,
      this.loadOptions
    )) as ImageType;
  }

  /** Fetches a tile using the deck.gl-compatible request shape. */
  async getTileData(parameters: GetTileDataParameters): Promise<ImageType | LERCData | null> {
    return this.getTile(parameters.index, parameters.signal);
  }

  /** Updates parameters applied to subsequent ImageServer export requests. */
  updateParameters(parameters: Record<string, string | number | boolean>): void {
    this._runtimeParameters = {...this._runtimeParameters, ...parameters};
  }

  /** Builds an ImageServer exportImage URL for one web-mercator tile. */
  getTileURL(parameters: GetTileParameters, tileSize?: number): string {
    const options = this.options['arcgis-image-server-tiles'] || {};
    const resolvedTileSize = tileSize || options.tileSize || 256;
    const [west, south, east, north] = getWebMercatorTileBounds(parameters);
    const url = new URL(this.getServiceURL(parameters));
    url.pathname = `${url.pathname.replace(/\/$/, '')}/exportImage`;
    const requestParameters = {
      f: 'image',
      bbox: `${west},${south},${east},${north}`,
      bboxSR: 3857,
      imageSR: 3857,
      size: `${resolvedTileSize},${resolvedTileSize}`,
      format: options.format || 'png32',
      transparent: true,
      ...options.parameters,
      ...this._runtimeParameters
    };
    for (const [key, value] of Object.entries(requestParameters)) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  /** Fetches the ImageServer metadata document. */
  private async _loadMetadata(): Promise<any> {
    const url = new URL(this.url);
    url.searchParams.set('f', 'pjson');
    const response = await this.fetch(url.toString());
    if (!response.ok) {
      throw new Error(`ArcGIS ImageServer metadata request failed: ${response.status}`);
    }
    return response.json();
  }

  /** Returns cached metadata and shares a single request among concurrent callers. */
  private async _getMetadata(): Promise<any> {
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
    const urls = this.options['arcgis-image-server-tiles']?.urls;
    return urls?.length ? urls[(parameters.x + parameters.y) % urls.length] : this.url;
  }
}

/** Source loader for ArcGIS ImageServer export tiles. */
export const ArcGISImageTileSourceLoader = {
  dataType: null as unknown as ArcGISImageTileSource,
  batchType: null as never,
  name: 'ArcGIS ImageServer tiles',
  id: 'arcgis-image-server-tiles',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-image-server-tiles',
  fromUrl: true,
  fromBlob: false,
  options: {'arcgis-image-server-tiles': {}},
  defaultOptions: {'arcgis-image-server-tiles': {}},
  testURL: (url: string): boolean => /imageserver/i.test(url),
  createDataSource: (
    url: string,
    options: ArcGISImageTileSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) => new ArcGISImageTileSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISImageTileSource>;

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
