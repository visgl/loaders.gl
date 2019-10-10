// Minimal support to load tilsets from the Cesium ION services

/* global fetch */
import {_getErrorMessageFromResponse} from '@loaders.gl/core';
// import assert from '../utils/assert';

const ARCGIS_SERVER_URL = 'https://...';

// Returns `{url, headers, type, attributions}` for an ion tileset
export async function getArcgisTilesetMetadata(accessToken, assetId) {
  // Step 1, if no asset id, look for first 3DTILES asset associated with this token.
  if (!assetId) {
    const assets = await getArcgisAssets(accessToken);
    for (const item of assets.items) {
      if (item.type === '3DTILES') {
        assetId = item.id;
      }
    }
  }

  // Step 2: Query metdatadata for this asset.
  const ionAssetMetadata = await getArcgisAssetMetadata(accessToken, assetId);
  // const {type, url} = ionAssetMetadata;
  // // assert(type === '3DTILES' && url);

  // Prepare a headers object for fetch
  ionAssetMetadata.headers = {
    Authorization: `Bearer ${ionAssetMetadata.accessToken}`
  };
  return ionAssetMetadata;
}

// Return a list of all assets associated with accessToken
export async function getArcgisAssets(accessToken) {
  // assert(accessToken);
  const url = ARCGIS_SERVER_URL;
  const headers = {Authorization: `Bearer ${accessToken}`};
  const response = await fetch(url, {headers});
  if (!response.ok) {
    throw new Error(await _getErrorMessageFromResponse(response));
  }
  return await response.json();
}

// Return metadata for a specific asset assocated with token
export async function getArcgisAssetMetadata(accessToken, assetId) {
  // assert(accessToken, assetId);
  const headers = {Authorization: `Bearer ${accessToken}`};

  const url = `${ARCGIS_SERVER_URL}/${assetId}`;

  let response = await fetch(`${url}`, {headers});
  if (!response.ok) {
    throw new Error(await _getErrorMessageFromResponse(response));
  }
  let metadata = await response.json();

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
