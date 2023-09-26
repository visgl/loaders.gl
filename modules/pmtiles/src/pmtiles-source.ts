import {GetTileParameters, ImageType, ImageTileSourceProps} from '@loaders.gl/loader-utils';
import {ImageTileSource} from '@loaders.gl/loader-utils';
import {ImageLoader} from '@loaders.gl/images';

import {PMTiles} from 'pmtiles';
// import {PMTiles, DecompressFunc} from 'pmtiles';
import {parsePMTilesMetadata} from './lib/parse-pmtiles';
import {TileLoadParameters} from 'modules/loader-utils/src/lib/sources/tile-source';

export type PMTilesImageSourceProps = ImageTileSourceProps & {
  url: string;
};

export class PMTilesImageSource extends ImageTileSource {
  pmtiles: PMTiles;

  constructor(props: PMTilesImageSourceProps) {
    super(props);
    this.pmtiles = new PMTiles(props.url);
  }

  async getMetadata(): Promise<any> {
    const header = await this.pmtiles.getHeader();
    const metadata = await this.pmtiles.getMetadata();
    return parsePMTilesMetadata(header, metadata);
  }

  async getTile(tileParams: GetTileParameters): Promise<ImageType | null> {
    const {x, y, zoom: z} = tileParams;
    const rangeResponse = await this.pmtiles.getZxy(z, x, y);
    const arrayBuffer = rangeResponse?.data;
    if (!arrayBuffer) {
      return null;
    }
    return ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  async getTileData(tileParams: TileLoadParameters): Promise<ImageType | null> {
    const {x, y, z} = tileParams.index;
    return await this.getTile({x, y, zoom: z, layers: []});
  }
}
