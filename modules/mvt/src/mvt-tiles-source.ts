// loaders.gl, MIT license

import type {GetTileParameters, ImageType, DataSourceProps} from '@loaders.gl/loader-utils';
import type {ImageTileSource, VectorTileSource} from '@loaders.gl/loader-utils';
import {DataSource, resolvePath} from '@loaders.gl/loader-utils';
import {ImageLoader} from '@loaders.gl/images';
import {MVTLoader, MVTLoaderOptions, TileJSONLoader, TileJSON} from '@loaders.gl/mvt';

import {TileLoadParameters} from '@loaders.gl/loader-utils';

export type MVTTilesSourceProps = DataSourceProps & {
  url: string;
  attributions?: string[];
};

/**
 * A PMTiles data source
 * @note Can be either a raster or vector tile source depending on the contents of the PMTiles file.
 */
export class MVTTilesSource extends DataSource implements ImageTileSource, VectorTileSource {
  props: MVTTilesSourceProps;
  url: string;
  schema: 'tms' | 'xyz' = 'tms';
  metadata: Promise<TileJSON | null>;

  constructor(props: MVTTilesSourceProps) {
    super(props);
    this.props = props;
    this.url = resolvePath(props.url);
    this.getTileData = this.getTileData.bind(this);
    this.metadata = this.getMetadata();
  }

  // @ts-ignore - Metadata type misalignment
  async getMetadata(): Promise<TileJSON | null> {
    const metadataUrl = this.getMetadataUrl(); 
    const response = await this.fetch(metadataUrl);
    if (!response.ok) {
      return null;
    }
    const tileJSON = await response.text()
    const metadata = TileJSONLoader.parseTextSync?.(JSON.stringify(tileJSON)) || null;
    // metadata.attributions = [...this.props.attributions, ...(metadata.attributions || [])];
    return metadata;
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
    const metadata = await this.metadata;
    // @ts-expect-error
    switch (metadata.mimeType || 'application/vnd.mapbox-vector-tile') {
      case 'application/vnd.mapbox-vector-tile':
        return await this.getVectorTile({x, y, zoom: z, layers: []});
      default:
        return await this.getImageTile({x, y, zoom: z, layers: []});
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
        tileIndex: {x: tileParams.x, y: tileParams.y, z: tileParams.zoom},
        ...(this.loadOptions as MVTLoaderOptions)?.mvt
      },
      ...this.loadOptions
    };

    return arrayBuffer ? await MVTLoader.parse(arrayBuffer, loadOptions) : null;
  }

  getMetadataUrl(): string {
    return `${this.url}/tilejson.json`;
  }

  getTileURL(x: number, y: number, z: number) {
    switch (this.schema) {
      case 'xyz':
        return `${this.url}/${x}/${y}/${z}`;
      case 'tms':
      default:
        return `${this.url}/${z}/${x}/${y}`;
    }
  }
}
