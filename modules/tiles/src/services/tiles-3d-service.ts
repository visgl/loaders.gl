// loaders.gl, MIT license

import type {Loader} from '@loaders.gl/loader-utils';

export type Tiles3DAttribution = {
  title: string;
  url: string;
  logoUrl?: string;
};

/**
 * Handles access token, metadata and attribution for a 3D tileset service.
 */
export abstract class Tiles3DService {
  static getServiceFromUrl(url: string, services: Tiles3DService[]): Tiles3DService | null {
    return services.find((service) => url.includes(service.urlKey)) || null;
  }

  /** id string */
  abstract readonly id: string;
  /** Human readable name */
  abstract readonly name: string;
  /** Identifies this service by matching a user supplied URL against this key */
  abstract readonly urlKey: string;
  /** Default attribution per supported tileset provider. */
  abstract readonly attribution: Tiles3DAttribution;

  /** Loader required by this particular service */
  abstract readonly loader: Loader;

  /** Base URL of this service */
  url: string;
  /** Access token for this service */
  accessToken: string;

  /**
   *
   * @param url Base url to the service
   * @param accessToken Access token for the service
   */
  constructor(url: string, accessToken: string) {
    this.url = url;
    this.accessToken = accessToken;
  }

  /** Queries metadata from a 3D tileset service.
   * @param url Url of a 3D tileset.
   * @param this.accessToken Optional access token.
   * @returns Downloaded metadata.
   */
  abstract getAssetCatalog(): Promise<unknown[]>;

  /** Test against map state - @todo outside of loaders.gl scope... */
  isSupported(mapState: any): boolean {
    return true;
  }
}
