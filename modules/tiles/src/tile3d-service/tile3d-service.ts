// loaders.gl, MIT license
import type {Loader} from '@loaders.gl/loader-utils';
import {_getIonTilesetMetadata} from '@loaders.gl/3d-tiles';

// TODO - we can't import everything here, so mock for now
const Tiles3DLoader: Loader = {};
const I3SLoader: Loader = {};
const CesiumIONLoader: Loader = {};

export type Tile3DAttribution = {
  title: string;
  url: string;
  logoUrl?: string;
  height?: number;
  bottom?: number;
};

abstract class Tile3DService {
  static getServiceFromUrl(url: string, services: Tile3DService[]): Tile3DService | null {
    return services.find((service) => url.includes(service.urlKey)) || null;
  }

  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly urlKey: string;
  /** Default attribution per supported tileset provider. */
  abstract readonly attribution: Tile3DAttribution;

  abstract readonly loader: Loader;

  url: string;
  accessToken: string;

  constructor(url: string, accessToken: string) {
    this.url = url;
    this.accessToken = accessToken;
  }

  /** Queries metadata from a 3D tileset service.
   * @param url Url of a 3D tileset.
   * @param this.accessToken Optional access token.
   * @returns Downloaded metadata.
   */
  abstract getMetadata(): Promise<any>;

  isSupported(mapState: any): boolean {
    return true;
  }
}

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
    const response = await fetch(`${url}?key=${this.accessToken}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.name} ${response.status}`);
    }
    return {name: this.name, ...(await response.json())};
  }
}

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

  readonly loader = CesiumIONLoader;

  async getMetadata(): Promise<any> {
    if (!this.accessToken) {
      throw new Error(`No access token for ${this.name}`);
    }
    const matched = this.url.match(/\/([0-9]+)\/tileset.json/);
    const assetId = matched && matched[1];
    const response = await _getIonTilesetMetadata(this.accessToken, assetId);
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

export class ArcGISI3SService extends Tile3DService {
  id = 'arcgis';
  name = 'ArcGIS';
  urlKey = 'arcgis';
  attribution = {
    title: 'Powered by Esri.',
    url: 'https://arcgis.com/',
    height: 16
  };

  loader = I3SLoader;

  async getMetadata(): Promise<any> {
    const response = await fetch(this.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${this.name} ${response.status}`);
    }
    return {name: this.name, ...(await response.json())};
  }
}
