// Minimal support to load tilsets from the Cesium ION services

/* global fetch */
import {_getErrorMessageFromResponse} from '@loaders.gl/core';
import {assert} from '@loaders.gl/loader-utils';

const CESIUM_ION_URL = 'https://api.cesium.com/v1/assets';

// Returns `{url, headers, type, attributions}` for an ion tileset
export async function getIonTilesetMetadata(accessToken, assetId) {
  // Step 1, if no asset id, look for first 3DTILES asset associated with this token.
  if (!assetId) {
    const assets = await getIonAssets(accessToken);
    for (const item of assets.items) {
      if (item.type === '3DTILES') {
        assetId = item.id;
      }
    }
  }

  // Step 2: Query metdatadata for this asset.
  const ionAssetMetadata = await getIonAssetMetadata(accessToken, assetId);
  const {type, url} = ionAssetMetadata;
  assert(type === '3DTILES' && url);

  // Prepare a headers object for fetch
  ionAssetMetadata.headers = {
    Authorization: `Bearer ${ionAssetMetadata.accessToken}`
  };
  return ionAssetMetadata;
}

// Return a list of all assets associated with accessToken
export async function getIonAssets(accessToken) {
  assert(accessToken);
  const url = CESIUM_ION_URL;
  const headers = {Authorization: `Bearer ${accessToken}`};
  const response = await fetch(url, {headers});
  if (!response.ok) {
    throw new Error(await _getErrorMessageFromResponse(response));
  }
  return await response.json();
}

// Return metadata for a specific asset assocated with token
export async function getIonAssetMetadata(accessToken, assetId) {
  assert(accessToken, assetId);
  const headers = {Authorization: `Bearer ${accessToken}`};

  const url = `${CESIUM_ION_URL}/${assetId}`;
  // https://cesium.com/docs/rest-api/#operation/getAsset
  // Retrieves metadata information about a specific asset.
  let response = await fetch(`${url}`, {headers});
  if (!response.ok) {
    throw new Error(await _getErrorMessageFromResponse(response));
  }
  let metadata = await response.json();

  // https://cesium.com/docs/rest-api/#operation/getAssetEndpoint
  // Retrieves information and credentials that allow you to access the tiled asset data for visualization and analysis.
  response = await fetch(`${url}/endpoint`, {headers});
  if (!response.ok) {
    throw new Error(await _getErrorMessageFromResponse(response));
  }
  const tilesetInfo = await response.json();

  // extract dataset description
  metadata = {
    ...metadata,
    ...tilesetInfo
  };

  return metadata;
}
