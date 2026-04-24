// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CoreAPI,
  SourceLoader,
  VectorTileSource,
  GetTileParameters,
  GetTileDataParameters
} from '@loaders.gl/loader-utils';
import type {BinaryFeatureCollection, Schema, Feature} from '@loaders.gl/schema';
import {TileSourceMetadata, DataSource, DataSourceOptions} from '@loaders.gl/loader-utils';
import {MLTLoaderWithParser} from './mlt-loader-with-parser';
import type {MLTLoaderOptions} from './mlt-loader';
import {MLTFormat} from './mlt-format';

export type MLTSourceLoaderOptions = DataSourceOptions & {
  mlt?: {
    /** Optional metadata URL. */
    metadataUrl?: string | null;
    /** Override file extension (default: `.mlt`). */
    extension?: string;
    /** Coordinates for parsed tile geometries. */
    coordinates?: 'wgs84' | 'local';
    /** Shape of returned data. */
    shape?: 'geojson-table' | 'geojson' | 'binary';
    /** Optional layer filter. */
    layers?: string[];
  };
};

/**
 * Source factory for MapLibre Tile (`.mlt`) tiles
 */
export const MLTSourceLoader = {
  dataType: null as unknown as MLTTileSource,
  batchType: null as never,
  ...MLTFormat,
  name: 'MLTTileSource',
  version: '0.0.0',
  type: 'mlt',
  fromUrl: true,
  fromBlob: false,

  options: {
    mlt: {
      extension: '.mlt',
      metadataUrl: null,
      coordinates: 'wgs84',
      shape: undefined!,
      layers: undefined!
    }
  },

  defaultOptions: {
    mlt: {
      extension: '.mlt',
      metadataUrl: null,
      coordinates: 'wgs84',
      shape: undefined!,
      layers: undefined!
    }
  },

  testURL: (url: string): boolean =>
    url.endsWith('.mlt') || url.endsWith('/plain') || isURLTemplate(url),
  createDataSource: (
    url: string,
    options: MLTSourceLoaderOptions,
    coreApi?: CoreAPI
  ): MLTTileSource => new MLTTileSource(url, options, coreApi)
} as const satisfies SourceLoader<MLTTileSource>;

/**
 * Vector tile source for MapLibre Tile files served by `z/x/y` tile services.
 */
export class MLTTileSource
  extends DataSource<string, MLTSourceLoaderOptions>
  implements VectorTileSource
{
  readonly metadataUrl: string | null;
  schema: 'tms' | 'xyz' | 'template' = 'tms';
  metadata: Promise<TileSourceMetadata>;
  extension: string;
  mimeType = 'application/vnd.maplibre-tile';

  constructor(url: string, options: MLTSourceLoaderOptions, coreApi?: CoreAPI) {
    super(url, options, MLTSourceLoader.defaultOptions, coreApi);
    this.metadataUrl = this.options.mlt?.metadataUrl || null;
    this.extension = this.options.mlt?.extension || '.mlt';

    this.getTileData = this.getTileData.bind(this);
    this.metadata = this.getMetadata();

    if (isURLTemplate(this.url)) {
      this.schema = 'template';
    }
  }

  async getSchema(): Promise<Schema> {
    return {fields: [], metadata: {}};
  }

  async getMetadata(): Promise<TileSourceMetadata> {
    const attributions = this.options.core?.attributions || [];

    if (!this.metadataUrl) {
      return {minZoom: 0, maxZoom: 30, attributions};
    }

    try {
      const response = await this.fetch(this.metadataUrl);
      if (!response.ok) {
        this.reportError(
          new Error(`${response.status} ${response.statusText}`),
          `Failed to fetch metadata from ${this.metadataUrl}`
        );
        return {minZoom: 0, maxZoom: 30, attributions};
      }

      const metadataText = await response.text();
      const metadataJson = JSON.parse(metadataText) as Record<string, unknown>;
      const minZoom = Number.isFinite(metadataJson?.minZoom as number)
        ? (metadataJson.minZoom as number)
        : Number.isFinite(metadataJson?.minzoom as number)
          ? (metadataJson.minzoom as number)
          : 0;
      const maxZoom = Number.isFinite(metadataJson?.maxZoom as number)
        ? (metadataJson.maxZoom as number)
        : Number.isFinite(metadataJson?.maxzoom as number)
          ? (metadataJson.maxzoom as number)
          : 30;
      return {
        ...metadataJson,
        minZoom,
        maxZoom,
        attributions: [...attributions, ...((metadataJson?.attributions as string[]) || [])]
      };
    } catch (error) {
      this.reportError(error, `Failed to fetch metadata from ${this.metadataUrl}`);
      return {minZoom: 0, maxZoom: 30, attributions};
    }
  }

  async getTile(parameters: GetTileParameters): Promise<ArrayBuffer | null> {
    const tileUrl = this.getTileURL(parameters.x, parameters.y, parameters.z);
    const response = await this.fetch(tileUrl);
    if (!response.ok) {
      this.reportError(
        new Error(`${response.status} ${response.statusText}`),
        `Failed to fetch tile ${tileUrl} ${JSON.stringify(parameters)}`
      );
      return null;
    }
    return response.arrayBuffer();
  }

  async getTileData(
    parameters: GetTileDataParameters
  ): Promise<Feature[] | BinaryFeatureCollection | null> {
    const {index} = parameters;
    return this.getVectorTile({x: index.x, y: index.y, z: index.z, layers: []});
  }

  async getVectorTile(
    tileParameters: GetTileParameters
  ): Promise<Feature[] | BinaryFeatureCollection | null> {
    const tileData = await this.getTile(tileParameters);
    return tileData ? this._parseTile(tileData, tileParameters) : null;
  }

  protected async _parseTile(
    arrayBuffer: ArrayBuffer,
    tileParameters: GetTileParameters
  ): Promise<Feature[] | BinaryFeatureCollection | null> {
    const options: MLTSourceLoaderOptions = this.options;
    const coordinates = options.mlt?.coordinates || 'wgs84';
    const shape = options.mlt?.shape || 'geojson';
    const tileIndex =
      coordinates === 'wgs84'
        ? {x: tileParameters.x, y: tileParameters.y, z: tileParameters.z}
        : undefined;
    const loadOptions: MLTLoaderOptions = {
      ...this.loadOptions,
      mlt: {
        ...(this.loadOptions as MLTLoaderOptions).mlt,
        shape,
        coordinates,
        layers: options.mlt?.layers,
        tileIndex
      }
    };

    const parsed = await MLTLoaderWithParser.parse(arrayBuffer, loadOptions);
    if (shape === 'geojson-table') {
      return (parsed as {features: Feature[]}).features || null;
    }

    if (shape === 'binary') {
      return parsed as BinaryFeatureCollection;
    }

    return parsed as Feature[];
  }

  getTileURL(x: number, y: number, z: number) {
    switch (this.schema) {
      case 'xyz':
        return `${this.url}/${x}/${y}/${z}${this.extension}`;
      case 'tms':
        return `${this.url}/${z}/${x}/${y}${this.extension}`;
      case 'template':
        return getURLFromTemplate(this.url, x, y, z, this.extension);
      default:
        throw new Error(`Unknown tile schema: ${this.schema}`);
    }
  }
}

export function isURLTemplate(s: string): boolean {
  return /(?=.*\{z\})(?=.*\{x\})(?=.*(\{y\}|\{\-y\}))|(?=.*\{x\})(?=.*(\{y\}|\{\-y\})(?=.*\{z\}))/i.test(
    s
  );
}

export function getURLFromTemplate(
  template: string,
  x: number,
  y: number,
  z: number,
  extension: string = ''
): string {
  const id = `${x}-${y}-${z}`;
  const url = template
    .replace(/\{x\}/g, x.toString())
    .replace(/\{-y\}/g, String((1 << z) - 1 - y))
    .replace(/\{y\}/g, y.toString())
    .replace(/\{z\}/g, z.toString())
    .replace(/\{id\}/g, id);

  if (!extension || url.endsWith(extension)) {
    return url;
  }

  // If template already contains an extension (e.g. ".mvt"), don't double-append.
  const path = url.split(/[?#]/, 1)[0];
  const file = path.split('/').pop() || '';
  if (/\.[a-z0-9]+$/i.test(file)) {
    return url;
  }

  return `${url}${extension}`;
}
