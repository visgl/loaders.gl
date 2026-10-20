// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '../../loader-types';
import type {RequestCredential, TokenProviderResponse} from './request-credentials';

/** A request after application-controlled URL resolution and signing. */
export type AuthenticatedRequest = {
  /** URL to send to the transport. */
  url: string;
  /** Complete request options, including any signed headers. */
  options: RequestInit;
};

/** Request details supplied to an application authentication callback. */
export type AuthenticationRequest = AuthenticatedRequest & {
  /** Whether this is the initial attempt or the single permitted replay. */
  reason: 'request' | 'retry';
  /** Failure metadata on replay; the response body is not exposed. */
  response?: TokenProviderResponse;
};

/** Resolves or signs an individual request without a provider SDK dependency. */
export type AuthenticateRequest = (
  request: AuthenticationRequest
) => AuthenticatedRequest | Promise<AuthenticatedRequest>;

/** Application-controlled request signing, optionally including URL rewriting. */
export type RequestAuthentication = Readonly<{
  /** Stable diagnostic identifier, never a secret. */
  id: string;
  /** Distinguishes callback credentials from token credentials. */
  type: 'request';
  /** Exact input origins; custom schemes may use authorities such as `s3://bucket`. */
  origins: readonly string[];
  /** Signs a fresh copy of the complete request on each attempt. */
  authenticate: AuthenticateRequest;
  /** Statuses permitting one replay of a replayable request. Defaults to no replay. */
  refreshStatusCodes?: readonly number[];
}>;

/** An instantiated credential accepted by the request pipeline. */
export type Authentication = RequestCredential | RequestAuthentication;

/** Declarative configuration passed to the registered constructor with a matching type. */
export type CredentialOptions = {
  /** Registered authentication class's static type. */
  type: string;
  /** Provider-specific configuration; use JSON values for serializable declarations. */
  [name: string]: unknown;
};

/** An instantiated credential or a declarative configuration. */
export type Credential = Authentication | CredentialOptions;

/** An application or loader supplied authentication class. */
export type AuthenticationConstructor = {
  /** Stable configuration discriminator; first registered class with this type wins. */
  readonly type: string;
  /** Constructs a credential from one entry in `core.credentials`. */
  new (options: any): Authentication;
};

/** Instantiates declarations without recreating credentials already supplied by the caller. */
export function resolveCredentials(
  credentials: readonly Credential[],
  authentications: readonly AuthenticationConstructor[] = []
): readonly Authentication[] {
  if (credentials.every(isAuthentication)) return credentials as readonly Authentication[];
  return credentials.map((credential, index) => {
    if (isAuthentication(credential)) return credential;
    const AuthenticationClass = authentications.find(
      authentication => authentication.type === credential?.type
    );
    if (!AuthenticationClass) {
      throw new Error(`No authentication class registered for credential at index ${index}.`);
    }
    let authentication: Authentication;
    try {
      authentication = new AuthenticationClass(credential);
    } catch {
      // Constructor messages may include credential configuration or secret material.
      throw new Error(`Invalid authentication configuration at index ${index}.`);
    }
    if (!isAuthentication(authentication)) {
      throw new Error(`Authentication class returned an invalid credential at index ${index}.`);
    }
    return authentication;
  });
}

/** Resolves credentials while preserving the remaining loader options and caller-owned arrays. */
export function resolveAuthenticationOptions<OptionsT extends LoaderOptions>(
  options: OptionsT
): OptionsT {
  if (!options.core?.credentials?.length) return options;
  const credentials = resolveCredentials(options.core.credentials, options.core.authentications);
  if (credentials === options.core.credentials) return options;
  return {...options, core: {...options.core, credentials}};
}

/** Discovers loader constructors before resolving declarative credentials for a load. */
export async function resolveLoaderAuthenticationOptions<OptionsT extends LoaderOptions>(
  loader: Loader | null | undefined,
  url: string,
  options: OptionsT
): Promise<OptionsT> {
  if (!options.core?.credentials?.length || options.core.credentials.every(isAuthentication)) {
    return options;
  }
  const contributions = await loader?.getAuthentications?.(url, options);
  if (!contributions?.length) return resolveAuthenticationOptions(options);
  return resolveAuthenticationOptions({
    ...options,
    core: {
      ...options.core,
      authentications: [...(options.core?.authentications || []), ...contributions]
    }
  });
}

/** Tests the public runtime credential shape without relying on class identity. */
function isAuthentication(credential: Credential): credential is Authentication {
  if (!credential || typeof credential !== 'object') return false;
  if (typeof credential.id !== 'string' || !Array.isArray(credential.origins)) return false;
  if (credential.type === 'request') return typeof credential.authenticate === 'function';
  return (
    (credential.type === 'header' || credential.type === 'query-parameter') &&
    typeof credential.name === 'string' &&
    (typeof credential.token === 'string' || typeof credential.token === 'function') &&
    Array.isArray(credential.refreshStatusCodes)
  );
}
