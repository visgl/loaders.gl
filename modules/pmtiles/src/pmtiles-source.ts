// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '@loaders.gl/schema';
import type {
  Source,
  VectorTileSource,
  GetTileParameters,
  GetTileDataParameters,
  ImageTileSource,
  ImageType
} from '@loaders.gl/loader-utils';
import {DataSource, DataSourceOptions, resolvePath} from '@loaders.gl/loader-utils';
import {ImageLoader, ImageLoaderOptions} from '@loaders.gl/images';
import {MVTLoader, MVTLoaderOptions, TileJSONLoaderOptions} from '@loaders.gl/mvt';

import * as pmtiles from 'pmtiles';
const {PMTiles} = pmtiles;

import type {PMTilesMetadata} from './lib/parse-pmtiles';
import {parsePMTilesHeader} from './lib/parse-pmtiles';
import {BlobSource} from './lib/blob-source';

const VERSION = '1.0.0';

export type PMTilesSourceOptions = DataSourceOptions & {
  core?: DataSourceOptions['core'] & {
    loadOptions?: TileJSONLoaderOptions & MVTLoaderOptions & ImageLoaderOptions;
  };
  pmtiles?: {};
};

/**
 * Creates vector tile data sources for PMTiles urls or blobs
 */
export const PMTilesSource = {
  name: 'PMTiles',
  id: 'pmtiles',
  module: 'pmtiles',
  version: VERSION,
  extensions: ['pmtiles'],
  mimeTypes: ['application/octet-stream'],
  type: 'pmtiles',
  fromUrl: true,
  fromBlob: true,

  defaultOptions: {
    pmtiles: {}
  },

  testURL: (url: string) => url.endsWith('.pmtiles'),
  createDataSource: (url: string | Blob, options: PMTilesSourceOptions) =>
    new PMTilesTileSource(url, options)
} as const satisfies Source<PMTilesTileSource>;

/**
 * A PMTiles data source
 * @note Can be either a raster or vector tile source depending on the contents of the PMTiles file.
 */
export class PMTilesTileSource
  extends DataSource<string | Blob, PMTilesSourceOptions>
  implements ImageTileSource, VectorTileSource
{
  mimeType: string | null = null;
  pmtiles: pmtiles.PMTiles;
  metadata: Promise<PMTilesMetadata>;

  constructor(data: string | Blob, options: PMTilesSourceOptions) {
    super(data, options, PMTilesSource.defaultOptions);
    const urlOrBlob =
      typeof data === 'string' ? resolvePath(data) : new BlobSource(data, 'pmtiles');
    this.pmtiles = new PMTiles(urlOrBlob);
    this.getTileData = this.getTileData.bind(this);
    this.metadata = this.getMetadata();
  }

  async getSchema(): Promise<Schema> {
    return {fields: [], metadata: {}};
  }

  async getMetadata(): Promise<PMTilesMetadata> {
    const pmtilesHeader = await this.pmtiles.getHeader();
    const pmtilesMetadata = ((await this.pmtiles.getMetadata()) as Record<string, unknown>) || {};
    const metadata: PMTilesMetadata = parsePMTilesHeader(
      pmtilesHeader,
      pmtilesMetadata,
      {includeFormatHeader: false},
      this.loadOptions
    );
    // Add additional attribution if necessary
    if (this.options.attributions) {
      metadata.attributions = [
        ...(this.options.core?.attributions || []),
        ...(metadata.attributions || [])
      ];
    }
    if (metadata?.tileMIMEType) {
      this.mimeType = metadata?.tileMIMEType;
    }
    // TODO - do we need to allow tileSize to be overridden? Some PMTiles examples seem to suggest it.
    return metadata;
  }

  async getTile(tileParams: GetTileParameters): Promise<ArrayBuffer | null> {
    const {x, y, z} = tileParams;
    const rangeResponse = await this.pmtiles.getZxy(z, x, y);
    const arrayBuffer = rangeResponse?.data;
    if (!arrayBuffer) {
      // console.error('No arrayBuffer', tileParams);
      return null;
    }
    return arrayBuffer;
  }

  // Tile Source interface implementation: deck.gl compatible API
  // TODO - currently only handles image tiles, not vector tiles

  async getTileData(tileParams: GetTileDataParameters): Promise<any> {
    const {x, y, z} = tileParams.index;
    const metadata = await this.metadata;
    switch (metadata.tileMIMEType) {
      case 'application/vnd.mapbox-vector-tile':
        return await this.getVectorTile({x, y, z, layers: []});
      default:
        return await this.getImageTile({x, y, z, layers: []});
    }
  }

  // ImageTileSource interface implementation

  async getImageTile(tileParams: GetTileParameters): Promise<ImageType | null> {
    const arrayBuffer = await this.getTile(tileParams);
    return arrayBuffer ? await ImageLoader.parse(arrayBuffer, this.loadOptions) : null;
  }

  // VectorTileSource interface implementation

  async getVectorTile(tileParams: GetTileParameters): Promise<unknown | null> {
    const arrayBuffer = await this.getTile(tileParams);
    const loadOptions: MVTLoaderOptions = {
      mvt: {
        shape: 'geojson-table',
        coordinates: 'wgs84',
        tileIndex: {x: tileParams.x, y: tileParams.y, z: tileParams.z},
        ...(this.loadOptions as MVTLoaderOptions)?.mvt
      },
      ...this.loadOptions
    };

    return arrayBuffer ? await MVTLoader.parse(arrayBuffer, loadOptions) : null;
  }
}
