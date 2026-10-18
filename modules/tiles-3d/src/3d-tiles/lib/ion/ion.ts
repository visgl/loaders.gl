// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {FetchLike, RequestCredential} from '@loaders.gl/loader-utils';
import {
  assert,
  createAuthenticatedFetch,
  createBearerTokenCredential
} from '@loaders.gl/loader-utils';

const CESIUM_ION_URL = 'https://api.cesium.com/v1/assets';
const CESIUM_ION_ORIGIN = 'https://api.cesium.com';

/** Cesium ion asset summary returned by the assets endpoint. */
export type CesiumIonAsset = {
  /** Asset identifier. */
  id: number;
  /** Asset type, such as `3DTILES`. */
  type: string;
  /** Additional provider metadata. */
  [key: string]: unknown;
};

/** Cesium ion asset listing. */
export type CesiumIonAssets = {
  /** Assets visible to the supplied credential. */
  items: CesiumIonAsset[];
};

/** Resolved Cesium ion endpoint metadata. */
export type CesiumIonTilesetMetadata = Record<string, unknown> & {
  /** Resolved 3D Tiles endpoint URL. */
  url: string;
  /** Resolved asset type. */
  type: string;
  /** Legacy endpoint headers retained for direct integrations. */
  headers: HeadersInit;
  /** Exact-origin endpoint credential preferred by loaders.gl integrations. */
  credentials: readonly RequestCredential[];
};

/** Optional transport for Cesium ion API requests. */
export type CesiumIonRequestOptions = {
  /** Credential-aware custom fetch implementation. */
  fetch?: FetchLike;
};

/** Resolves a Cesium ion asset URL and its endpoint-scoped bearer credential. */
export async function getIonTilesetMetadata(
  accessToken: string | null | undefined,
  assetId?: number | string | null,
  options: CesiumIonRequestOptions = {}
): Promise<CesiumIonTilesetMetadata> {
  const ionFetch = getIonFetch(accessToken, options.fetch);
  let resolvedAssetId = assetId;
  if (!resolvedAssetId) {
    const assets = await getIonAssets(accessToken, ionFetch);
    resolvedAssetId = assets.items.find(item => item.type === '3DTILES')?.id;
  }

  if (resolvedAssetId === undefined || resolvedAssetId === null) {
    throw new Error('Cesium ion did not return a 3D Tiles asset.');
  }
  const ionAssetMetadata = await getIonAssetMetadata(accessToken, resolvedAssetId, ionFetch);
  const type = String(ionAssetMetadata.type || '');
  const endpointOptions = ionAssetMetadata.options as {url?: string} | undefined;
  const url = endpointOptions?.url || String(ionAssetMetadata.url || '');
  assert(type === '3DTILES' && url);

  const endpointToken = String(ionAssetMetadata.accessToken || accessToken || '');
  assert(endpointToken);
  const endpointCredential = createBearerTokenCredential({
    id: `cesium-ion-asset-${resolvedAssetId}`,
    origins: [new URL(url).origin],
    token: endpointToken
  });

  return {
    ...ionAssetMetadata,
    type,
    url,
    headers: {Authorization: `Bearer ${endpointToken}`},
    credentials: [endpointCredential]
  };
}

/** Returns the Cesium ion assets visible to an access token. */
export async function getIonAssets(
  accessToken: string | null | undefined,
  fetchFunction?: FetchLike
): Promise<CesiumIonAssets> {
  const response = await (fetchFunction || getIonFetch(accessToken))(CESIUM_ION_URL);
  if (!response.ok) {
    throw new Error(response.statusText || `Cesium ion request failed: ${response.status}`);
  }
  return (await response.json()) as CesiumIonAssets;
}

/** Returns combined Cesium ion asset and endpoint metadata. */
export async function getIonAssetMetadata(
  accessToken: string | null | undefined,
  assetId: number | string,
  fetchFunction?: FetchLike
): Promise<Record<string, unknown>> {
  assert(assetId);
  const ionFetch = fetchFunction || getIonFetch(accessToken);
  const url = `${CESIUM_ION_URL}/${assetId}`;
  let response = await ionFetch(url);
  if (!response.ok) {
    throw new Error(response.statusText || `Cesium ion request failed: ${response.status}`);
  }
  const metadata = (await response.json()) as Record<string, unknown>;

  response = await ionFetch(`${url}/endpoint`);
  if (!response.ok) {
    throw new Error(response.statusText || `Cesium ion request failed: ${response.status}`);
  }
  const endpoint = (await response.json()) as Record<string, unknown>;
  return {...metadata, ...endpoint};
}

/** Creates an exact-origin transport for Cesium ion REST requests. */
function getIonFetch(accessToken: string | null | undefined, fetchFunction?: FetchLike): FetchLike {
  const credentials = accessToken
    ? [
        createBearerTokenCredential({
          id: 'cesium-ion-access-token',
          origins: [CESIUM_ION_ORIGIN],
          token: accessToken
        })
      ]
    : [];
  return createAuthenticatedFetch({fetch: fetchFunction, credentials});
}
