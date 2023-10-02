import type {GetTileParameters, ImageType, DataSourceProps} from '@loaders.gl/loader-utils';
import type {ImageTileSource, VectorTileSource} from '@loaders.gl/loader-utils';
import {DataSource, resolvePath} from '@loaders.gl/loader-utils';
import {ImageLoader} from '@loaders.gl/images';
import {MVTLoader, MVTLoaderOptions} from '@loaders.gl/mvt';

import * as pmtiles from 'pmtiles';
const {PMTiles} = pmtiles;
// import type {pPMTilesMetadata} from './lib/parse-pmtiles';
import {PMTilesMetadata, parsePMTilesHeader} from './lib/parse-pmtiles';
import {TileLoadParameters} from 'modules/loader-utils/src/lib/sources/tile-source';

export type PMTilesSourceProps = DataSourceProps & {
  url: string;
  attributions?: string[];
};

/**
 * A PMTiles data source
 * @note Can be either a raster or vector tile source depending on the contents of the PMTiles file.
 */
export class PMTilesSource extends DataSource implements ImageTileSource, VectorTileSource {
  props: PMTilesSourceProps;
  pmtiles: pmtiles.PMTiles;
  metadata: Promise<PMTilesMetadata>;

  constructor(props: PMTilesSourceProps) {
    super(props);
    this.props = props;
    const url = resolvePath(props.url);
    this.pmtiles = new PMTiles(url);
    this.getTileData = this.getTileData.bind(this);
    this.metadata = this.getMetadata();
  }

  async getMetadata(): Promise<PMTilesMetadata> {
    const pmtilesHeader = await this.pmtiles.getHeader();
    const pmtilesMetadata = await this.pmtiles.getMetadata();
    const metadata = parsePMTilesHeader(pmtilesHeader, pmtilesMetadata);
    if (this.props.attributions) {
      metadata.attributions = [...this.props.attributions, ...(metadata.attributions || [])];
    }
    return metadata;
  }

  async getTile(tileParams: GetTileParameters): Promise<ArrayBuffer | null> {
    const {x, y, zoom: z} = tileParams;
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

  async getTileData(tileParams: TileLoadParameters): Promise<unknown | null> {
    const {x, y, z} = tileParams.index;
    const metadata = await this.metadata;
    switch (metadata.mimeType) {
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
}
