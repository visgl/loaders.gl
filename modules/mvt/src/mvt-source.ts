// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Source,
  ImageType,
  DataSourceProps,
  ImageTileSource,
  VectorTileSource,
  GetTileParameters,
  GetTileDataParameters
} from '@loaders.gl/loader-utils';
import {DataSource, resolvePath} from '@loaders.gl/loader-utils';
import {ImageLoader, ImageLoaderOptions, getBinaryImageMetadata} from '@loaders.gl/images';
import {
  MVTLoader,
  MVTLoaderOptions,
  TileJSONLoader,
  TileJSON,
  TileJSONLoaderOptions
} from '@loaders.gl/mvt';

/** Creates an MVTTileSource */
export const MVTSource = {
  name: 'MVT',
  id: 'mvt',
  module: 'mvt',
  version: '0.0.0',
  extensions: ['mvt'],
  mimeTypes: ['application/octet-stream'],
  options: {
    mvt: {
      // TODO - add options here
    }
  },
  type: 'mvt',
  fromUrl: true,
  fromBlob: false,

  testURL: (url: string): boolean => true,
  createDataSource(url: string, props: MVTTileSourceProps): MVTTileSource {
    return new MVTTileSource(url, props);
  }
} as const satisfies Source<MVTTileSource, MVTTileSourceProps>;

/** Properties for a Mapbox Vector Tile Source */
export type MVTTileSourceProps = DataSourceProps & {
  mvt?: {
    // TODO - add options here
    /** if not supplied, loads tilejson.json, If null does not load metadata */
    metadataUrl?: string | null;
    /** Override extension (necessary if no metadata) */
    extension?: string;
    /** Additional attribution, adds to any attribution loaded from tileset metadata */
    attributions?: string[];
    /** Specify load options for all sub loaders */
    loadOptions?: TileJSONLoaderOptions & MVTLoaderOptions & ImageLoaderOptions;
  };
};

/**
 * MVT data source for Mapbox Vector Tiles v1.
 */
/**
 * A PMTiles data source
 * @note Can be either a raster or vector tile source depending on the contents of the PMTiles file.
 */
export class MVTTileSource extends DataSource implements ImageTileSource, VectorTileSource {
  readonly props: MVTTileSourceProps;
  readonly url: string;
  readonly metadataUrl: string | null = null;
  data: string;
  schema: 'tms' | 'xyz' | 'template' = 'tms';
  metadata: Promise<TileJSON | null>;
  extension: string;
  mimeType: string | null = null;

  constructor(url: string, props: MVTTileSourceProps) {
    super(props);
    this.props = props;
    this.url = resolvePath(url);
    this.metadataUrl = props.mvt?.metadataUrl || `${this.url}/tilejson.json`;
    this.extension = props.mvt?.extension || '.png';
    this.data = this.url;

    this.getTileData = this.getTileData.bind(this);
    this.metadata = this.getMetadata();

    if (isURLTemplate(this.url)) {
      this.schema = 'template';
    }
  }

  // @ts-ignore - Metadata type misalignment
  async getMetadata(): Promise<TileJSON | null> {
    if (!this.metadataUrl) {
      return null;
    }

    let response: Response;
    try {
      // Annoyingly, on CORS errors, fetch doesn't use the response status/ok mechanism but instead throws
      // CORS errors are common when requesting an unavailable sub resource such as a metadata file or an unavailable tile)
      response = await this.fetch(this.metadataUrl);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error((error as TypeError).message);
      return null;
    }
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(response.statusText);
      return null;
    }
    const tileJSON = await response.text();
    const metadata = TileJSONLoader.parseTextSync?.(tileJSON) || null;

    // TODO add metadata attributions
    // metadata.attributions = [...this.props.attributions, ...(metadata.attributions || [])];
    // if (metadata?.mimeType) {
    //   this.mimeType = metadata?.tileMIMEType;
    // }

    return metadata;
  }

  getTileMIMEType(): string | null {
    return this.mimeType;
  }

  async getTile(parameters: GetTileParameters): Promise<ArrayBuffer | null> {
    const {x, y, z} = parameters;
    const tileUrl = this.getTileURL(x, y, z);
    const response = await this.fetch(tileUrl);
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }

  // Tile Source interface implementation: deck.gl compatible API
  // TODO - currently only handles image tiles, not vector tiles

  async getTileData(parameters: GetTileDataParameters): Promise<any> {
    const {x, y, z} = parameters.index;
    // const metadata = await this.metadata;
    // mimeType = metadata?.tileMIMEType || 'application/vnd.mapbox-vector-tile';

    const arrayBuffer = await this.getTile({x, y, z, layers: []});
    if (arrayBuffer === null) {
      return null;
    }

    const imageMetadata = getBinaryImageMetadata(arrayBuffer);
    this.mimeType =
      this.mimeType || imageMetadata?.mimeType || 'application/vnd.mapbox-vector-tile';
    switch (this.mimeType) {
      case 'application/vnd.mapbox-vector-tile':
        return await this._parseVectorTile(arrayBuffer, {x, y, z, layers: []});
      default:
        return await this._parseImageTile(arrayBuffer);
    }
  }

  // ImageTileSource interface implementation

  async getImageTile(tileParams: GetTileParameters): Promise<ImageType | null> {
    const arrayBuffer = await this.getTile(tileParams);
    return arrayBuffer ? this._parseImageTile(arrayBuffer) : null;
  }

  protected async _parseImageTile(arrayBuffer: ArrayBuffer): Promise<ImageType> {
    return await ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  // VectorTileSource interface implementation

  async getVectorTile(tileParams: GetTileParameters): Promise<unknown | null> {
    const arrayBuffer = await this.getTile(tileParams);
    return arrayBuffer ? this._parseVectorTile(arrayBuffer, tileParams) : null;
  }

  protected async _parseVectorTile(
    arrayBuffer: ArrayBuffer,
    tileParams: GetTileParameters
  ): Promise<unknown | null> {
    const loadOptions: MVTLoaderOptions = {
      shape: 'geojson-table',
      mvt: {
        coordinates: 'wgs84',
        tileIndex: {x: tileParams.x, y: tileParams.y, z: tileParams.z},
        ...(this.loadOptions as MVTLoaderOptions)?.mvt
      },
      ...this.loadOptions
    };

    return await MVTLoader.parse(arrayBuffer, loadOptions);
  }

  getMetadataUrl(): string | null {
    return this.metadataUrl;
  }

  getTileURL(x: number, y: number, z: number) {
    switch (this.schema) {
      case 'xyz':
        return `${this.url}/${x}/${y}/${z}${this.extension}`;
      case 'tms':
        return `${this.url}/${z}/${x}/${y}${this.extension}`;
      case 'template':
        return getURLFromTemplate(this.url, x, y, z, '0');
      default:
        throw new Error(this.schema);
    }
  }
}

export function isURLTemplate(s: string): boolean {
  return /(?=.*{z})(?=.*{x})(?=.*({y}|{-y}))|(?=.*{x})(?=.*({y}|{-y})(?=.*{z}))/.test(s);
}

export type URLTemplate = string | string[];

const xRegex = new RegExp('{x}', 'g');
const yRegex = new RegExp('{y}', 'g');
const zRegex = new RegExp('{z}', 'g');

/**
 * Get a URL from a URL template
 * @note copied from deck.gl/modules/geo-layers/src/tileset-2d/utils.ts
 * @param template - URL template
 * @param x - tile x coordinate
 * @param y - tile y coordinate
 * @param z - tile z coordinate
 * @param id - tile id
 * @returns URL
 */
export function getURLFromTemplate(
  template: URLTemplate,
  x: number,
  y: number,
  z: number,
  id: string = '0'
): string {
  if (Array.isArray(template)) {
    const i = stringHash(id) % template.length;
    template = template[i];
  }

  let url = template;
  url = url.replace(xRegex, String(x));
  url = url.replace(yRegex, String(y));
  url = url.replace(zRegex, String(z));

  // Back-compatible support for {-y}
  if (Number.isInteger(y) && Number.isInteger(z)) {
    url = url.replace(/\{-y\}/g, String(Math.pow(2, z) - y - 1));
  }

  return url;
}

function stringHash(s: string): number {
  return Math.abs(s.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
}
