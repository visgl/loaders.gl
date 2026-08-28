// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RequestCredential, TokenValue} from '@loaders.gl/loader-utils';
import {
  createBearerTokenCredential,
  createQueryParameterCredential
} from '@loaders.gl/loader-utils';

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

/** Creates a bearer credential for the Cesium ion REST API. */
export function createCesiumIonCredential(options: CesiumIonCredentialOptions): RequestCredential {
  return createBearerTokenCredential({
    id: 'cesium-ion-access-token',
    origins: options.origins || ['https://api.cesium.com'],
    token: options.accessToken
  });
}
