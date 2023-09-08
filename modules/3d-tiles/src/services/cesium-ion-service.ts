// loaders.gl, MIT license

import {Tile3DService} from '@loaders.gl/tiles';
import {getIonTilesetMetadata} from '../lib/ion/ion';
import {CesiumIonLoader} from '../cesium-ion-loader';

/**
 * Attribution for Cesium ion.
 * @see https://cesium.com/legal/terms-of-service/
 */
export class CesiumIONService extends Tile3DService {
  readonly id = 'cesium';
  readonly name = 'Cesium ion';
  readonly urlKey = 'ion.cesium';
  readonly attribution = {
    title: 'Cesium.',
    url: 'https://cesium.com/',
    height: 16,
    bottom: -2
  };

  /** @todo remove CesiumIONLoader, integrate into service? */
  readonly loader = CesiumIonLoader;

  async getMetadata(): Promise<any> {
    if (!this.accessToken) {
      throw new Error(`No access token for ${this.name}`);
    }
    const matched = /\/([0-9]+)\/tileset.json/.exec(this.url);
    const assetId = matched && matched[1];
    const response = await getIonTilesetMetadata(this.accessToken, assetId);
    if (response.status !== 'COMPLETE') {
      throw new Error(`Failed to fetch ${this.name} ${response.status}`);
    }
    return {name: this.name, ...response};
  }

  getUrl(tileUrl: string): string {
    return `${tileUrl}?key=${this.accessToken}`;
  }

  getLoadOptions() {
    return {fetch: {headers: {'X-GOOG-API-KEY': this.accessToken}}};
  }
}
