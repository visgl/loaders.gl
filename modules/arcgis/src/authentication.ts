// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RequestCredential, TokenValue} from '@loaders.gl/loader-utils';
import {TokenAuthentication, createQueryParameterCredential} from '@loaders.gl/loader-utils';

/** Declarative ArcGIS token authentication. */
export class ArcGISAuthentication extends TokenAuthentication {
  /** Discriminator used in `core.credentials`. */
  static readonly type = 'arcgis';
  /** Creates an exact-origin ArcGIS credential. */
  constructor(options: ArcGISCredentialOptions) {
    super(createArcGISCredential(options));
  }
}

/** Options for an ArcGIS REST service credential. */
export type ArcGISCredentialOptions = {
  /** ArcGIS token or application-managed token callback. */
  token: TokenValue;
  /** Exact ArcGIS Online or Enterprise origins authorized to receive the token. */
  origins: readonly string[];
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
