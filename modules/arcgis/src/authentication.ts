// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  AuthenticatedFetchOptions,
  FetchLike,
  RequestCredential,
  TokenValue
} from '@loaders.gl/loader-utils';
import {
  TokenAuthentication,
  createAuthenticatedFetch,
  createQueryParameterCredential
} from '@loaders.gl/loader-utils';

/** ArcGIS token authentication independent of the application's sign-in SDK. */
export class ArcGISAuthentication extends TokenAuthentication {
  /** Discriminator used in `core.credentials`. */
  static readonly type = 'arcgis';
  /** Creates an exact-origin ArcGIS credential. */
  constructor(options: ArcGISCredentialOptions) {
    super(createArcGISCredential(options));
  }

  /**
   * Creates a fetch transport for discovery and service requests.
   * Refreshes are isolated by trusted origin so server-specific tokens cannot cross hosts.
   * Reuse the returned transport to deduplicate concurrent refreshes within each origin.
   */
  createFetch(options: Pick<AuthenticatedFetchOptions, 'fetch' | 'fetchOptions'> = {}): FetchLike {
    return createAuthenticatedFetch({
      ...options,
      credentials: this.origins.map(origin =>
        createArcGISCredential({
          origins: [origin],
          token: this.token
        })
      )
    });
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
  return {
    ...createQueryParameterCredential({
      id: 'arcgis-token',
      origins: options.origins,
      parameterName: 'token',
      token: options.token,
      refreshStatusCodes: [401, 403, 498, 499]
    }),
    shouldRefresh: isArcGISAuthenticationError,
    canReplayRequest: canReplayArcGISRequest
  };
}

/**
 * Detects small JSON authentication errors without buffering successful feature/tile bodies.
 * Only 498/499 envelopes trigger renewal; permission and query errors remain visible.
 */
async function isArcGISAuthenticationError(response: Response): Promise<boolean> {
  if (response.status !== 200 || !response.headers.get('content-type')?.includes('json'))
    return false;
  const reader = response.clone().body?.getReader();
  if (!reader) return false;
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (length <= 16384) {
      const {value, done} = await reader.read();
      if (done) {
        const bytes = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        const json = JSON.parse(new TextDecoder().decode(bytes));
        return json?.error?.code === 498 || json?.error?.code === 499;
      }
      length += value.length;
      chunks.push(value);
    }
    return false;
  } catch {
    return false;
  } finally {
    // A tee cancellation can wait for the original consumer; do not await it here.
    void reader.cancel().catch(() => {});
  }
}

/** Permits only buffered form POST queries on numbered feature or map layers. */
function canReplayArcGISRequest(url: string, request: RequestInit): boolean {
  return (
    request.method?.toUpperCase() === 'POST' &&
    /\/(FeatureServer|MapServer)\/\d+\/query\/?$/i.test(new URL(url).pathname) &&
    new Headers(request.headers).get('content-type')?.split(';')[0] ===
      'application/x-www-form-urlencoded' &&
    typeof request.body === 'string'
  );
}
