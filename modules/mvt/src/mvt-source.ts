// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {GetTileParameters, ImageType, DataSourceProps} from '@loaders.gl/loader-utils';
import type {ImageTileSource, VectorTileSource} from '@loaders.gl/loader-utils';
import {DataSource, resolvePath} from '@loaders.gl/loader-utils';
import {ImageLoader, getBinaryImageMetadata} from '@loaders.gl/images';
import {MVTLoader, MVTLoaderOptions, TileJSONLoader, TileJSON} from '@loaders.gl/mvt';

import {TileLoadParameters} from '@loaders.gl/loader-utils';
import {get} from 'http';

export type MVTSourceProps = DataSourceProps & {
  url: string;
  attributions?: string[];
};

/**
 * A PMTiles data source
 * @note Can be either a raster or vector tile source depending on the contents of the PMTiles file.
 */
export class MVTSource extends DataSource implements ImageTileSource, VectorTileSource {
  props: MVTSourceProps;
  url: string;
  data: string;
  schema: 'tms' | 'xyz' = 'tms';
  metadata: Promise<TileJSON | null>;
  extension = '.png';
  mimeType: string | null = null;

  constructor(props: MVTSourceProps) {
    super(props);
    this.props = props;
    this.url = resolvePath(props.url);
    this.data = this.url;
    this.getTileData = this.getTileData.bind(this);
    this.metadata = this.getMetadata();
  }

  // @ts-ignore - Metadata type misalignment
  async getMetadata(): Promise<TileJSON | null> {
    const metadataUrl = this.getMetadataUrl();
    let response: Response;
    try {
      // Annoyingly, fetch throws on CORS errors which is common when requesting an unavailable resource
      response = await this.fetch(metadataUrl);
    } catch(error: unknown) {
      console.error((error as TypeError).message);
      return null;
    }
    if (!response.ok) {
      console.error(response.statusText);
      return null;
    }
    const tileJSON = await response.text();
    const metadata = TileJSONLoader.parseTextSync?.(JSON.stringify(tileJSON)) || null;
    // metadata.attributions = [...this.props.attributions, ...(metadata.attributions || [])];
    // if (metadata?.mimeType) {
    //   this.mimeType = metadata?.tileMIMEType;
    // } 
    return metadata;
  }

  getTileMIMEType(): string | null {
    return this.mimeType;
  }

  async getTile(tileParams: GetTileParameters): Promise<ArrayBuffer | null> {
    const {x, y, zoom: z} = tileParams;
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

  async getTileData(tileParams: TileLoadParameters): Promise<unknown | null> {
    const {x, y, z} = tileParams.index;
    // const metadata = await this.metadata;
    // mimeType = metadata?.tileMIMEType || 'application/vnd.mapbox-vector-tile';

    const arrayBuffer = await this.getTile({x, y, zoom: z, layers: []});
    if (arrayBuffer === null) {
      return null;
    }

    const imageMetadata = getBinaryImageMetadata(arrayBuffer);
    this.mimeType = this.mimeType || imageMetadata?.mimeType || 'application/vnd.mapbox-vector-tile';
    switch (this.mimeType) {
      case 'application/vnd.mapbox-vector-tile':
        return await this.parseVectorTile(arrayBuffer, {x, y, zoom: z, layers: []});
      default:
        return await this.parseImageTile(arrayBuffer);
    }
  }x

  // ImageTileSource interface implementation

  async getImageTile(tileParams: GetTileParameters): Promise<ImageType | null> {
    const arrayBuffer = await this.getTile(tileParams);
    return arrayBuffer ? this.parseImageTile(arrayBuffer) : null;
  }

  protected async parseImageTile(arrayBuffer: ArrayBuffer): Promise<ImageType> {
      return await ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  // VectorTileSource interface implementation

  async getVectorTile(tileParams: GetTileParameters): Promise<unknown | null> {
    const arrayBuffer = await this.getTile(tileParams);
    return arrayBuffer ? this.parseVectorTile(arrayBuffer, tileParams) : null;
  }

  protected async parseVectorTile(arrayBuffer: ArrayBuffer, tileParams: GetTileParameters): Promise<unknown | null> {
    const loadOptions: MVTLoaderOptions = {
      shape: 'geojson-table',
      mvt: {
        coordinates: 'wgs84',
        tileIndex: {x: tileParams.x, y: tileParams.y, z: tileParams.zoom},
        ...(this.loadOptions as MVTLoaderOptions)?.mvt
      },
      ...this.loadOptions
    };

    return await MVTLoader.parse(arrayBuffer, loadOptions);
  }

  getMetadataUrl(): string {
    return `${this.url}/tilejson.json`;
  }

  getTileURL(x: number, y: number, z: number) {
    switch (this.schema) {
      case 'xyz':
        return `${this.url}/${x}/${y}/${z}${this.extension}`;
      case 'tms':
      default:
        return `${this.url}/${z}/${x}/${y}${this.extension}`;
    }
  }
}
