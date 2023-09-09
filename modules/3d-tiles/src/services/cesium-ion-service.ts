// loaders.gl, MIT license

import {Tile3DService} from '@loaders.gl/tiles';
import {CesiumIonLoader} from '../cesium-ion-loader';
import {fetchFile} from '@loaders.gl/core';

const CESIUM_ION_URL = 'https://api.cesium.com/v1/assets';

export type IONAsset = {
  type: '3DTILES' | 'GLTF' | 'IMAGERY' | 'TERRAIN' | 'KML' | 'GEOJSON';
  id: string;
  name: string;
  description: string;
  attribution: string;
};

export type IONAssetMetadata = {
  type: '3DTILES' | 'GLTF' | 'IMAGERY' | 'TERRAIN' | 'KML' | 'GEOJSON';

  // Asset info
  id: string;
  name: string;
  description: string;
  attribution: string;

  // Endpoint info
  url: string;
  /** Resource specific access token valid for ~1 hour. Re-request metadata to refresh */
  accessToken: string;
  attributions: {
    html: string;
    collapsible?: boolean;
  }[];
};

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
    url: 'https://cesium.com/'
  };

  /** @todo remove CesiumIONLoader, integrate into service? */
  readonly loader = CesiumIonLoader;

  async getAssetCatalog(): Promise<IONAsset[]> {
    if (!this.accessToken) {
      throw new Error(`No access token for ${this.name}`);
    }

    const url = CESIUM_ION_URL;
    const response = await fetchFile(url, {headers: {Authorization: `Bearer ${this.accessToken}`}});
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const assetJson = await response.json();

    const assets = assetJson.items;
    // Remove any pending or errored assets
    return assets.filter((asset) => asset.status === 'COMPLETE') as IONAsset[];
  }

  /**
   * Retrieves metadata information about a specific ION asset.
   * @param assetId
   * @returns {url, headers, type, attributions} for an ion tileset
   */
  async getAssetMetadata(assetId: string): Promise<IONAssetMetadata> {
    if (!this.accessToken) {
      throw new Error(`No access token for ${this.name}`);
    }

    // Retrieves metadata information about a specific asset.
    // @see https://cesium.com/docs/rest-api/#operation/getAsset
    const url = `${CESIUM_ION_URL}/${assetId}`;
    let response = await fetchFile(`${url}`, {
      headers: {Authorization: `Bearer ${this.accessToken}`}
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    let metadata = await response.json();
    if (metadata.status !== 'COMPLETE') {
      throw new Error(`Incomplete ION asset ${assetId}`);
    }

    // Retrieves information and credentials that allow you to access the tiled asset data for visualization and analysis.
    // https://cesium.com/docs/rest-api/#operation/getAssetEndpoint
    response = await fetchFile(`${url}/endpoint`, {
      headers: {Authorization: `Bearer ${this.accessToken}`}
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const tilesetInfo = await response.json();

    // extract dataset description
    metadata = {
      ...metadata,
      ...tilesetInfo,
      headers: {
        Authorization: `Bearer ${tilesetInfo.accessToken}`
      }
    };

    return metadata as IONAssetMetadata;
  }

  async getMetadataForUrl(url: string): Promise<any> {
    const parsedUrl = this.parseUrl(url);
    if (!parsedUrl) {
      throw new Error(`Invalid url ${url}`);
    }
    const assetMetadata = await this.getAssetMetadata(parsedUrl.assetId);
    // return {name: this.name, ...assetMetadata};
    return assetMetadata;
  }

  parseUrl(url: string): {assetId: string; resource: string} | null {
    const matched = /\/([0-9]+)\/tileset.json/.exec(this.url);
    const assetId = matched && matched[1];
    return assetId ? {assetId, resource: 'tileset.json'} : null;
  }

  getUrl(tileUrl: string): string {
    return `${tileUrl}?key=${this.accessToken}`;
  }
}
