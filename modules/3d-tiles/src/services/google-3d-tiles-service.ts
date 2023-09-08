// loaders.gl, MIT license

import {Tile3DService} from '@loaders.gl/tiles';
import {Tiles3DLoader} from '../tiles-3d-loader';

/**
 * @see https://developers.google.com/maps/documentation/tile/policies
 * attribution shouldn't be hidden (right now dataset attribution is only partly shown and expanded on hover).
 * attribution should be visible (right now displayed with a grayish color, unnoticeable with Google 3d tiles)
 * Google logo should be displayed on the bottom left side (where FSQ watermark is located).
 */
export class Google3DTilesService extends Tile3DService {
  readonly id = 'google';
  readonly name = 'Google 3D Tiles';
  readonly urlKey = 'google';
  // Also, attribution for Google 3D tiles is collected from visible tiles.
  readonly attribution = {
    title: 'Built with Google Maps.',
    url: '',
    logoUrl:
      'https://developers.google.com/static/maps/documentation/images/google_on_non_white.png',
    height: 16
  };

  readonly loader = Tiles3DLoader;

  isSupported(mapState: any): boolean {
    return mapState.globe?.enabled || mapState.zoom < 8;
  }

  async getMetadata(): Promise<any> {
    if (!this.accessToken) {
      throw new Error(`No access token for ${this.name}`);
    }
    const response = await fetch(`${this.url}?key=${this.accessToken}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.name} ${response.status}`);
    }
    return {name: this.name, ...(await response.json())};
  }
}
