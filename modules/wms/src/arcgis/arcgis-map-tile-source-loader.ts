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
    /** Optional custom tile URL template. */
    urlTemplate?: string;
    /** Additional query parameters sent to the metadata endpoint. */
    parameters?: Record<string, string>;
    /** Metadata document supplied by the application. */
    metadata?: ArcGISMapServerMetadata;
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
  tileInfo?: {lods?: {level: number}[]; rows?: number; cols?: number; format?: string};
};

/** ArcGIS MapServer source for cached `/tile/{z}/{y}/{x}` image tiles. */
export class ArcGISMapTileSource
  extends DataSource<string, ArcGISMapTileSourceLoaderOptions>
  implements TileSource
{
  private _metadata: any | null = null;

  /** Creates an ArcGIS MapServer tile source. */
  constructor(url: string, options: ArcGISMapTileSourceLoaderOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, ArcGISMapTileSourceLoader.defaultOptions, coreApi);
    this.getTileData = this.getTileData.bind(this);
  }

  /** Loads and normalizes ArcGIS service metadata. */
  async getMetadata(): Promise<TileSourceMetadata> {
    this._metadata ||= await this._loadMetadata();
    const extent = this._metadata.fullExtent;
    const spatialReference = this._metadata.spatialReference || extent?.spatialReference;
    return {
      name: this._metadata.name || '',
      title: this._metadata.name || '',
      abstract: this._metadata.description || this._metadata.serviceDescription || '',
      attributions: this._metadata.copyrightText ? [this._metadata.copyrightText] : undefined,
      minZoom: 0,
      maxZoom: this._metadata.tileInfo?.lods?.length
        ? Math.max(...this._metadata.tileInfo.lods.map(lod => lod.level))
        : undefined,
      boundingBox: extent
        ? [
            [extent.xmin, extent.ymin],
            [extent.xmax, extent.ymax]
          ]
        : undefined,
      layer: {
        name: this._metadata.name || '',
        srs: spatialReference?.wkid ? [`EPSG:${spatialReference.wkid}`] : [],
        layers: []
      }
    };
  }

  /** Fetches and decodes one cached ArcGIS tile. */
  async getTile(parameters: GetTileParameters, signal?: AbortSignal): Promise<ImageType | null> {
    const response = await this.fetch(this.getTileURL(parameters), signal ? {signal} : undefined);
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
    const url = new URL(this.url);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/tile/${parameters.z}/${parameters.y}/${parameters.x}`;
    return url.toString();
  }

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
}

/** Source loader for ArcGIS cached MapServer tiles. */
export const ArcGISMapTileSourceLoader = {
  dataType: null as unknown as ArcGISMapTileSource,
  batchType: null as never,
  name: 'ArcGIS MapServer tiles',
  id: 'arcgis-map-server',
  module: 'wms',
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
