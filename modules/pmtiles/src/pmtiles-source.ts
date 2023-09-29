import type {GetTileParameters, ImageType, DataSourceProps} from '@loaders.gl/loader-utils';
import type {ImageTileSource, VectorTileSource} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {ImageLoader} from '@loaders.gl/images';
import {MVTLoader} from '@loaders.gl/mvt';

import {PMTiles} from 'pmtiles';
// import type {pPMTilesMetadata} from './lib/parse-pmtiles';
import {parsePMTilesHeader} from './lib/parse-pmtiles';
import {TileLoadParameters} from 'modules/loader-utils/src/lib/sources/tile-source';

export type PMTilesSourceProps = DataSourceProps & {
  url: string;
};

/**
 * A PMTiles data source
 * @note Can be either a raster or vector tile source depending on the contents of the PMTiles file.
 */
export class PMTilesSource extends DataSource implements ImageTileSource, VectorTileSource {
  pmtiles: PMTiles;

  constructor(props: PMTilesSourceProps) {
    super(props);
    this.pmtiles = new PMTiles(props.url);
  }

  async getMetadata(): Promise<any> {
    const header = await this.pmtiles.getHeader();
    const metadata = await this.pmtiles.getMetadata();
    return parsePMTilesHeader(header, metadata);
  }

  async getTile(tileParams: GetTileParameters): Promise<ArrayBuffer | null> {
    const {x, y, zoom: z} = tileParams;
    const rangeResponse = await this.pmtiles.getZxy(z, x, y);
    const arrayBuffer = rangeResponse?.data;
    return arrayBuffer || null;
  }

  // ImageTileSource interface implementation

  async getImageTile(tileParams: GetTileParameters): Promise<ImageType | null> {
    const arrayBuffer = await this.getTile(tileParams);
    return arrayBuffer ? await ImageLoader.parse(arrayBuffer, this.loadOptions) : null;
  }

  // VectorTileSource interface implementation

  async getVectorTile(tileParams: GetTileParameters): Promise<unknown | null> {
    const arrayBuffer = await this.getTile(tileParams);
    return arrayBuffer ? await MVTLoader.parse(arrayBuffer, this.loadOptions) : null;
  }

  // Tile Source interface implementation: deck.gl compatible API
  // TODO - currently only handles image tiles, not vector tiles

  async getTileData(tileParams: TileLoadParameters): Promise<ImageType | null> {
    const {x, y, z} = tileParams.index;
    return await this.getImageTile({x, y, zoom: z, layers: []});
  }
}
