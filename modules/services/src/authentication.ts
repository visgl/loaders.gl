// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  FetchLike,
  RequestCredential,
  TokenProviderContext,
  TokenValue
} from '@loaders.gl/loader-utils';
import {
  createAuthenticatedFetch,
  createBearerTokenCredential,
  createQueryParameterCredential
} from '@loaders.gl/loader-utils';

const CESIUM_ION_API_ORIGIN = 'https://api.cesium.com';
const CESIUM_ION_ASSET_ORIGINS = [
  'https://assets.ion.cesium.com',
  'https://assets.cesium.com'
] as const;

/** Shared options for provider credential presets with known public API origins. */
export type ServiceCredentialOptions = {
  /** Replaces the provider's default exact-origin allowlist. */
  origins?: readonly string[];
};

/** Options for an ArcGIS REST service credential. */
export type ArcGISCredentialOptions = {
  /** ArcGIS token or application-managed token callback. */
  token: TokenValue;
  /** Exact ArcGIS Online or Enterprise origins authorized to receive the token. */
  origins: readonly string[];
};

/** Options for a Mapbox API credential. */
export type MapboxCredentialOptions = ServiceCredentialOptions & {
  /** Mapbox public access token or application-managed token callback. */
  accessToken: TokenValue;
};

/** Options for a Google Maps Platform credential. */
export type GoogleMapsCredentialOptions = ServiceCredentialOptions & {
  /** Google Maps Platform API key or application-managed key callback. */
  apiKey: TokenValue;
};

/** Options for a Cesium ion API credential. */
export type CesiumIonCredentialOptions = ServiceCredentialOptions & {
  /** Cesium ion access token or application-managed token callback. */
  accessToken: TokenValue;
  /** Optional asset whose endpoint-scoped token should be resolved. */
  assetId?: number | string;
  /** Overrides the transport used for the ion endpoint-token exchange. */
  fetch?: FetchLike;
  /** Whether the supplied token is account-scoped or already asset-scoped. */
  tokenType?: 'account' | 'asset' | 'auto';
};

/** Creates an exact-origin ArcGIS `token` query credential. */
export function createArcGISCredential(options: ArcGISCredentialOptions): RequestCredential {
  return createQueryParameterCredential({
    id: 'arcgis-token',
    origins: options.origins,
    parameterName: 'token',
    token: options.token,
    refreshStatusCodes: [401, 403, 498, 499]
  });
}

/** Creates a Mapbox `access_token` query credential. */
export function createMapboxCredential(options: MapboxCredentialOptions): RequestCredential {
  return createQueryParameterCredential({
    id: 'mapbox-access-token',
    origins: options.origins || ['https://api.mapbox.com'],
    parameterName: 'access_token',
    token: options.accessToken
  });
}

/** Creates a Google Maps Platform `key` query credential. */
export function createGoogleMapsCredential(
  options: GoogleMapsCredentialOptions
): RequestCredential {
  return createQueryParameterCredential({
    id: 'google-maps-api-key',
    origins: options.origins || ['https://tile.googleapis.com'],
    parameterName: 'key',
    token: options.apiKey
  });
}

/**
 * Creates a bearer credential for the Cesium ion REST API or one Cesium ion asset.
 *
 * Supplying `assetId` creates an asset-origin credential. Account tokens are exchanged lazily
 * through Cesium ion's endpoint API; legacy asset-scoped tokens are used directly. Without an
 * `assetId`, the credential is scoped only to the ion REST API for backwards compatibility.
 */
export function createCesiumIonCredential(options: CesiumIonCredentialOptions): RequestCredential {
  if (options.assetId === undefined || options.assetId === null) {
    return createBearerTokenCredential({
      id: 'cesium-ion-access-token',
      origins: options.origins || [CESIUM_ION_API_ORIGIN],
      token: options.accessToken
    });
  }

  const assetId = options.assetId;
  const origins = options.origins || CESIUM_ION_ASSET_ORIGINS;
  let endpointTokenPromise: Promise<string | null> | null = null;

  return createBearerTokenCredential({
    id: `cesium-ion-asset-${assetId}`,
    origins,
    token: context => {
      if (context.reason === 'refresh') {
        endpointTokenPromise = null;
      }
      endpointTokenPromise ||= resolveCesiumIonAssetToken(options, assetId, origins, context);
      return endpointTokenPromise;
    }
  });
}

/** Resolves an account token and exchanges it for an asset endpoint token when required. */
async function resolveCesiumIonAssetToken(
  options: CesiumIonCredentialOptions,
  assetId: number | string,
  origins: readonly string[],
  context: TokenProviderContext
): Promise<string | null> {
  const endpointURL = `${CESIUM_ION_API_ORIGIN}/v1/assets/${assetId}/endpoint`;
  const accessToken =
    typeof options.accessToken === 'function'
      ? await options.accessToken({...context, url: endpointURL})
      : options.accessToken;
  if (!accessToken) return null;

  const tokenType = options.tokenType || 'auto';
  if (
    tokenType === 'asset' ||
    (tokenType === 'auto' && isCesiumIonAssetToken(accessToken, assetId))
  ) {
    return accessToken;
  }

  const apiCredential = createBearerTokenCredential({
    id: `cesium-ion-api-${assetId}`,
    origins: [CESIUM_ION_API_ORIGIN],
    token: accessToken
  });
  const ionFetch = createAuthenticatedFetch({
    fetch: options.fetch,
    credentials: [apiCredential]
  });
  const response = await ionFetch(endpointURL);
  if (!response.ok) {
    throw new Error(`Cesium ion asset ${assetId} endpoint request failed: ${response.status}`);
  }

  const endpoint = (await response.json()) as {accessToken?: unknown; url?: unknown};
  if (typeof endpoint.url !== 'string' || !origins.includes(new URL(endpoint.url).origin)) {
    throw new Error(`Cesium ion asset ${assetId} resolved to an unconfigured origin.`);
  }
  if (typeof endpoint.accessToken !== 'string' || !endpoint.accessToken) {
    throw new Error(`Cesium ion did not return an endpoint token for asset ${assetId}.`);
  }
  return endpoint.accessToken;
}

/** Detects legacy JWTs whose claims scope them directly to the requested asset. */
function isCesiumIonAssetToken(token: string, assetId: number | string): boolean {
  try {
    const encodedClaims = token.split('.')[1];
    if (!encodedClaims) return false;
    const base64 = encodedClaims.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims = JSON.parse(atob(paddedBase64)) as {assets?: unknown};
    return (
      Array.isArray(claims.assets) &&
      claims.assets.some(claimAssetId => String(claimAssetId) === String(assetId))
    );
  } catch {
    return false;
  }
}
