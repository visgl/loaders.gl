// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '@loaders.gl/schema';
import type {GetTileParameters, GetTileDataParameters} from '@loaders.gl/loader-utils';
import type {ImageType, DataSourceProps} from '@loaders.gl/loader-utils';
import type {ImageTileSource, VectorTileSource} from '@loaders.gl/loader-utils';
import {DataSource, resolvePath} from '@loaders.gl/loader-utils';
import {ImageLoader, ImageLoaderOptions} from '@loaders.gl/images';
import {MVTLoader, MVTLoaderOptions, TileJSONLoaderOptions} from '@loaders.gl/mvt';

import * as pmtiles from 'pmtiles';
const {PMTiles} = pmtiles;

import type {PMTilesMetadata} from './lib/parse-pmtiles';
import {parsePMTilesHeader} from './lib/parse-pmtiles';
import {BlobSource} from './lib/blob-source';

const VERSION = '1.0.0';

export type Service = {
  name: string;
  id: string;
  module: string;
  version: string;
  extensions: string[];
  mimeTypes: string[];
  options: Record<string, unknown>;
};

export type ServiceWithSource<SourceT, SourcePropsT> = Service & {
  _source?: SourceT;
  _sourceProps?: SourcePropsT;
  createSource: (props: SourcePropsT) => SourceT;
};

export const PMTilesService: ServiceWithSource<PMTilesSource, PMTilesSourceProps> = {
  name: 'PMTiles',
  id: 'pmtiles',
  module: 'pmtiles',
  version: VERSION,
  extensions: ['pmtiles'],
  mimeTypes: ['application/octet-stream'],
  options: {
    pmtiles: {}
  },
  createSource: (props: PMTilesSourceProps) => new PMTilesSource(props)
};

export type PMTilesSourceProps = DataSourceProps & {
  url: string | Blob;
  attributions?: string[];
  loadOptions?: TileJSONLoaderOptions & MVTLoaderOptions & ImageLoaderOptions;
};

/**
 * A PMTiles data source
 * @note Can be either a raster or vector tile source depending on the contents of the PMTiles file.
 */
export class PMTilesSource extends DataSource implements ImageTileSource, VectorTileSource {
  data: string | Blob;
  props: PMTilesSourceProps;
  mimeType: string | null = null;
  pmtiles: pmtiles.PMTiles;
  metadata: Promise<PMTilesMetadata>;

  constructor(props: PMTilesSourceProps) {
    super(props);
    this.props = props;
    const url =
      typeof props.url === 'string' ? resolvePath(props.url) : new BlobSource(props.url, 'pmtiles');
    this.data = props.url;
    this.pmtiles = new PMTiles(url);
    this.getTileData = this.getTileData.bind(this);
    this.metadata = this.getMetadata();
  }

  async getSchema(): Promise<Schema> {
    return {fields: [], metadata: {}};
  }

  async getMetadata(): Promise<PMTilesMetadata> {
    const pmtilesHeader = await this.pmtiles.getHeader();
    const pmtilesMetadata = await this.pmtiles.getMetadata();
    const metadata: PMTilesMetadata = parsePMTilesHeader(
      pmtilesHeader,
      pmtilesMetadata,
      {includeFormatHeader: false},
      this.loadOptions
    );
    // Add additional attribution if necessary
    if (this.props.attributions) {
      metadata.attributions = [...this.props.attributions, ...(metadata.attributions || [])];
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
      shape: 'geojson-table',
      mvt: {
        coordinates: 'wgs84',
        tileIndex: {x: tileParams.x, y: tileParams.y, z: tileParams.z},
        ...(this.loadOptions as MVTLoaderOptions)?.mvt
      },
      ...this.loadOptions
    };

    return arrayBuffer ? await MVTLoader.parse(arrayBuffer, loadOptions) : null;
  }
}
