// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {FetchLike} from '../../types';
import type {LoaderOptions} from '../../loader-types';
import type {
  Authentication,
  AuthenticationConstructor,
  AuthenticationRequest,
  Credential,
  RequestAuthentication
} from './authentication';
import {resolveCredentials} from './authentication';

/** Reason an application token provider is being invoked. */
export type TokenProviderReason = 'request' | 'refresh';

/** Safe response metadata supplied when refreshing an expired credential. */
export type TokenProviderResponse = Readonly<{
  /** HTTP response status. */
  status: number;
  /** HTTP response headers. */
  headers: Headers;
}>;

/** Context supplied to an application token provider. */
export type TokenProviderContext = Readonly<{
  /** Credential-free request URL before authorization is applied. */
  url: string;
  /** Whether the token is needed for an initial request or one refresh attempt. */
  reason: TokenProviderReason;
  /** Failed response metadata, when refreshing. */
  response?: TokenProviderResponse;
}>;

/** Returns a current token or refreshes it after an authentication failure. */
export type TokenProvider = (
  context: TokenProviderContext
) => string | null | Promise<string | null>;

/** Static token or application-managed asynchronous token provider. */
export type TokenValue = string | TokenProvider;

/** Request credential understood by the loaders.gl authentication pipeline. */
export type RequestCredential = Readonly<{
  /** Stable diagnostic identifier that never contains the token itself. */
  id: string;
  /** Exact URL origins authorized to receive this credential. */
  origins: readonly string[];
  /** Credential placement. */
  type: 'query-parameter' | 'header';
  /** Query parameter or header name. */
  name: string;
  /** Optional header value prefix, such as `Bearer `. */
  prefix?: string;
  /** Static token or application token callback. */
  token: TokenValue;
  /** Status codes that permit one refresh and replay. */
  refreshStatusCodes: readonly number[];
}>;

/** Options for a query-parameter credential. */
export type QueryParameterCredentialOptions = {
  /** Stable diagnostic identifier. */
  id: string;
  /** Exact URL origins authorized to receive this credential. */
  origins: readonly string[];
  /** Query parameter name. */
  parameterName: string;
  /** Static token or application token callback. */
  token: TokenValue;
  /** Status codes that permit one refresh and replay. Defaults to 401 and 403. */
  refreshStatusCodes?: readonly number[];
};

/** Options for a bearer credential. */
export type BearerTokenCredentialOptions = {
  /** Stable diagnostic identifier. */
  id: string;
  /** Exact URL origins authorized to receive this credential. */
  origins: readonly string[];
  /** Static token or application token callback. */
  token: TokenValue;
  /** Header name. Defaults to `Authorization`. */
  headerName?: string;
  /** Header prefix. Defaults to `Bearer `. */
  prefix?: string;
  /** Status codes that permit one refresh and replay. Defaults to 401 and 403. */
  refreshStatusCodes?: readonly number[];
};

/** Options for creating a credential-aware fetch function. */
export type AuthenticatedFetchOptions = {
  /** Fetch implementation wrapped by the credential pipeline. Defaults to global fetch. */
  fetch?: FetchLike;
  /** Credentials applied to matching request origins. */
  credentials: readonly Credential[];
  /** Classes available to instantiate declarative credential entries. */
  authentications?: readonly AuthenticationConstructor[];
  /** Static request defaults, merged before authentication and signing. */
  fetchOptions?: RequestInit;
};

type ResolvedCredential = {credential: RequestCredential; token: string};

const DEFAULT_REFRESH_STATUS_CODES = [401, 403] as const;
const AUTHENTICATED_FETCH = Symbol('loaders.gl.authenticated-fetch');
const refreshPromises = new WeakMap<RequestCredential, Promise<string | null>>();

/** Metadata used to compose authenticated transports without applying signatures twice. */
type AuthenticatedFetchMetadata = {
  /** Original transport below the authentication pipeline. */
  fetch: FetchLike;
  /** Resolved credentials in application precedence order. */
  credentials: readonly Authentication[];
  /** Declaration identities already instantiated by this transport pipeline. */
  credentialResolutions: ReadonlyMap<Credential, Authentication>;
  /** Defaults applied before authentication. */
  fetchOptions?: RequestInit;
};

/** Creates a token credential placed in a URL query parameter. */
export function createQueryParameterCredential(
  options: QueryParameterCredentialOptions
): RequestCredential {
  return {
    id: options.id,
    origins: normalizeOrigins(options.origins),
    type: 'query-parameter',
    name: options.parameterName,
    token: options.token,
    refreshStatusCodes: options.refreshStatusCodes || DEFAULT_REFRESH_STATUS_CODES
  };
}

/** Creates a token credential placed in an HTTP bearer header. */
export function createBearerTokenCredential(
  options: BearerTokenCredentialOptions
): RequestCredential {
  return {
    id: options.id,
    origins: normalizeOrigins(options.origins),
    type: 'header',
    name: options.headerName || 'Authorization',
    prefix: options.prefix ?? 'Bearer ',
    token: options.token,
    refreshStatusCodes: options.refreshStatusCodes || DEFAULT_REFRESH_STATUS_CODES
  };
}

/** Base for authentication classes that adapt configuration to a token credential. */
export class TokenAuthentication implements RequestCredential {
  /** Stable identifier used in diagnostics. */
  readonly id: string;
  /** Exact origins authorized to receive the token. */
  readonly origins: readonly string[];
  /** Transport placement of the token. */
  readonly type: 'header' | 'query-parameter';
  /** Header or query parameter name. */
  readonly name: string;
  /** Optional prefix for header values. */
  readonly prefix?: string;
  /** Static token or application-managed token provider. */
  readonly token: TokenValue;
  /** Statuses that permit one refresh and replay. */
  readonly refreshStatusCodes: readonly number[];

  /** Initializes the instance from an existing transport credential. */
  constructor(credential: RequestCredential) {
    this.id = credential.id;
    this.origins = credential.origins;
    this.type = credential.type;
    this.name = credential.name;
    this.prefix = credential.prefix;
    this.token = credential.token;
    this.refreshStatusCodes = credential.refreshStatusCodes;
  }
}

/** Instantiates a query-token credential from declarative configuration. */
export class QueryParameterAuthentication extends TokenAuthentication {
  /** Discriminator used in `core.credentials`. */
  static readonly type = 'query-parameter';

  /** Creates a scoped query-token credential. */
  constructor(options: QueryParameterCredentialOptions) {
    super(createQueryParameterCredential(options));
  }
}

/** Instantiates a bearer credential from declarative configuration. */
export class BearerTokenAuthentication extends TokenAuthentication {
  /** Discriminator used in `core.credentials`. */
  static readonly type = 'bearer-token';

  /** Creates a scoped bearer credential. */
  constructor(options: BearerTokenCredentialOptions) {
    super(createBearerTokenCredential(options));
  }
}

/** Wraps a fetch function with exact-origin credential application and one refresh replay. */
export function createAuthenticatedFetch(options: AuthenticatedFetchOptions): FetchLike {
  const suppliedFetch = options.fetch || ((url, requestOptions) => fetch(url, requestOptions));
  const existingMetadata = (
    suppliedFetch as FetchLike & {[AUTHENTICATED_FETCH]?: AuthenticatedFetchMetadata}
  )[AUTHENTICATED_FETCH];
  const credentialResolutions = new Map(existingMetadata?.credentialResolutions);
  const resolvedCredentials = resolveCredentials(
    options.credentials.map(credential => credentialResolutions.get(credential) || credential),
    options.authentications
  );
  options.credentials.forEach((credential, index) => {
    credentialResolutions.set(credential, resolvedCredentials[index]);
  });
  if (
    !options.fetchOptions &&
    (!resolvedCredentials.length ||
      (existingMetadata?.credentials.length === resolvedCredentials.length &&
        resolvedCredentials.every(
          (credential, index) => credential === existingMetadata.credentials[index]
        )))
  )
    return suppliedFetch;
  const baseFetch = existingMetadata?.fetch || suppliedFetch;
  const credentials = existingMetadata
    ? [...new Set([...resolvedCredentials, ...existingMetadata.credentials])]
    : resolvedCredentials;
  const fetchOptions = mergeFetchOptions(
    existingMetadata?.fetchOptions || {},
    options.fetchOptions
  );
  const tokenCredentials = credentials.filter(
    (credential): credential is RequestCredential => credential.type !== 'request'
  );
  const requestCredentials = credentials.filter(
    (credential): credential is RequestAuthentication => credential.type === 'request'
  );
  // Validate scopes before any request, including custom scheme authorities for callbacks.
  for (const credential of requestCredentials) normalizeRequestOrigins(credential.origins);

  const authenticatedFetch: FetchLike = async (url, requestOptions = {}) => {
    requestOptions = mergeFetchOptions(fetchOptions, requestOptions);
    if (requestOptions.signal?.aborted) throw createAbortError();
    // Request defaults alone must not normalize URLs or defer the transport invocation.
    if (!credentials.length) return baseFetch(url, requestOptions);
    const resolvedURL = parseHTTPURL(url);
    const authorization = resolvedURL
      ? await authorizeRequest(resolvedURL, requestOptions, tokenCredentials)
      : {url, options: requestOptions, credentials: []};
    const signedRequest = await authenticateRequest(authorization, requestCredentials, 'request');
    const response = await baseFetch(signedRequest.url, signedRequest.options);
    const refreshableCredentials = authorization.credentials.filter(
      ({credential}) =>
        typeof credential.token === 'function' &&
        credential.refreshStatusCodes.includes(response.status)
    );
    const shouldRetrySignature = signedRequest.credentials.some(credential =>
      credential.refreshStatusCodes?.includes(response.status)
    );
    if (
      (!refreshableCredentials.length && !shouldRetrySignature) ||
      !isReplayableRequest(requestOptions) ||
      !isReplayableRequest(signedRequest.options)
    )
      return response;
    if (requestOptions.signal?.aborted) throw createAbortError();

    const refreshedTokens = new Map<RequestCredential, string>();
    await Promise.all(
      refreshableCredentials.map(async ({credential}) => {
        const token = await refreshCredential(credential, url, response);
        if (token) refreshedTokens.set(credential, token);
      })
    );
    if (!refreshedTokens.size && !shouldRetrySignature) return response;

    await response.body?.cancel().catch(() => {});
    if (requestOptions.signal?.aborted) throw createAbortError();
    const replayAuthorization = resolvedURL
      ? await authorizeRequest(
          resolvedURL,
          requestOptions,
          tokenCredentials,
          refreshedTokens,
          authorization.credentials
        )
      : {url, options: requestOptions};
    const replayRequest = await authenticateRequest(
      replayAuthorization,
      requestCredentials,
      'retry',
      response
    );
    return baseFetch(replayRequest.url, replayRequest.options);
  };

  Object.defineProperty(authenticatedFetch, AUTHENTICATED_FETCH, {
    value: {
      fetch: baseFetch,
      credentials,
      credentialResolutions,
      fetchOptions
    } satisfies AuthenticatedFetchMetadata
  });
  return authenticatedFetch;
}

/**
 * Creates a credential-aware fetch function from standard loader options.
 * @param options Loader options containing an optional fetch override and scoped credentials.
 * @returns A fetch function that preserves request defaults and applies matching credentials.
 */
export function getAuthenticatedFetch(options: LoaderOptions = {}): FetchLike {
  const fetchOption = options.fetch ?? options.core?.fetch;
  let fetchFunction: FetchLike;

  if (typeof fetchOption === 'function') {
    fetchFunction = fetchOption;
  } else {
    fetchFunction = (url, requestOptions) => fetch(url, requestOptions);
  }

  return createAuthenticatedFetch({
    fetch: fetchFunction,
    fetchOptions: typeof fetchOption === 'object' && fetchOption ? fetchOption : undefined,
    credentials: options.core?.credentials || [],
    authentications: options.core?.authentications
  });
}

/** Combines default and per-request fetch options without replacing either header collection. */
function mergeFetchOptions(defaultOptions: RequestInit, requestOptions?: RequestInit): RequestInit {
  const mergedOptions = {...defaultOptions, ...requestOptions};
  if (defaultOptions.headers || requestOptions?.headers) {
    const headers = new Headers(defaultOptions.headers);
    new Headers(requestOptions?.headers).forEach((value, key) => headers.set(key, value));
    mergedOptions.headers = headers;
  }
  return mergedOptions;
}

/** Redacts credential-bearing query parameters from a URL used in diagnostics. */
export function redactCredentialURL(url: string, credentials: readonly Credential[]): string {
  const resolvedURL = parseHTTPURL(url);
  if (!resolvedURL) return url;
  if (credentials.some(credential => credential.type === 'request')) {
    // A signer can rewrite the destination; its input scope cannot identify output URLs.
    for (const name of [...resolvedURL.searchParams.keys()]) {
      resolvedURL.searchParams.set(name, '[REDACTED]');
    }
  }
  for (const credential of credentials) {
    if (
      credential.type === 'query-parameter' &&
      Array.isArray(credential.origins) &&
      credential.origins.includes(resolvedURL.origin) &&
      typeof credential.name === 'string' &&
      resolvedURL.searchParams.has(credential.name)
    ) {
      resolvedURL.searchParams.set(credential.name, '[REDACTED]');
    }
  }
  return resolvedURL.toString();
}

/** Applies request callbacks after token placement, preserving cancellation across URL rewrites. */
async function authenticateRequest(
  request: {url: string; options: RequestInit},
  credentials: readonly RequestAuthentication[],
  reason: AuthenticationRequest['reason'],
  response?: Response
): Promise<{url: string; options: RequestInit; credentials: RequestAuthentication[]}> {
  const appliedCredentials: RequestAuthentication[] = [];
  const signal = request.options.signal;
  for (const credential of credentials) {
    const origin = getRequestOrigin(request.url);
    if (!origin || !normalizeRequestOrigins(credential.origins).includes(origin)) continue;
    if (signal?.aborted) throw createAbortError();
    const authenticatedRequest = await credential.authenticate({
      url: request.url,
      options: {...request.options, headers: new Headers(request.options.headers)},
      reason,
      response: response
        ? {status: response.status, headers: new Headers(response.headers)}
        : undefined
    });
    if (
      !authenticatedRequest ||
      typeof authenticatedRequest.url !== 'string' ||
      !authenticatedRequest.options ||
      typeof authenticatedRequest.options !== 'object'
    ) {
      throw new Error('Authentication callback returned an invalid request.');
    }
    request = {
      url: authenticatedRequest.url,
      options: {...authenticatedRequest.options, ...(signal ? {signal} : {})}
    };
    appliedCredentials.push(credential);
  }
  if (signal?.aborted) throw createAbortError();
  return {...request, credentials: appliedCredentials};
}

/** Returns an exact origin or custom-scheme authority without collapsing opaque URL origins. */
function getRequestOrigin(url: string): string | null {
  try {
    const parsedURL = new URL(url);
    if (!parsedURL.host || parsedURL.username || parsedURL.password) return null;
    return parsedURL.origin !== 'null'
      ? parsedURL.origin
      : `${parsedURL.protocol}//${parsedURL.host}`;
  } catch {
    return null;
  }
}

/** Validates callback scopes, including custom scheme authorities such as `s3://bucket`. */
function normalizeRequestOrigins(origins: readonly string[]): string[] {
  if (!origins.length)
    throw new Error('Request authentication requires at least one exact origin.');
  return origins.map(origin => {
    const resolvedOrigin = getRequestOrigin(origin);
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw new Error('Invalid request authentication origin.');
    }
    if (!resolvedOrigin || (url.pathname && url.pathname !== '/') || url.search || url.hash) {
      throw new Error('Invalid request authentication origin.');
    }
    return resolvedOrigin;
  });
}

/** Resolves matching tokens and applies them to a fresh URL and header collection. */
async function authorizeRequest(
  sourceURL: URL,
  requestOptions: RequestInit,
  credentials: readonly RequestCredential[],
  tokenOverrides: ReadonlyMap<RequestCredential, string> = new Map(),
  previousCredentials: readonly ResolvedCredential[] = []
): Promise<{url: string; options: RequestInit; credentials: ResolvedCredential[]}> {
  const url = new URL(sourceURL);
  const headers = new Headers(requestOptions.headers);
  const resolvedCredentials: ResolvedCredential[] = [];
  const previousTokens = new Map(
    previousCredentials.map(({credential, token}) => [credential, token] as const)
  );

  for (const credential of credentials) {
    if (!credential.origins.includes(url.origin)) continue;
    const overrideToken = tokenOverrides.get(credential);
    const previousToken = previousTokens.get(credential);
    const ownsQueryParameter = credential.type === 'query-parameter' && previousToken !== undefined;
    const ownsHeader = credential.type === 'header' && previousToken !== undefined;
    if (
      (credential.type === 'query-parameter' &&
        url.searchParams.has(credential.name) &&
        !ownsQueryParameter) ||
      (credential.type === 'header' && headers.has(credential.name) && !ownsHeader)
    ) {
      continue;
    }
    const token =
      overrideToken ??
      previousToken ??
      (await resolveToken(credential.token, {url: sourceURL.toString(), reason: 'request'}));
    if (!token) continue;

    if (credential.type === 'query-parameter') {
      url.searchParams.set(credential.name, token);
    } else {
      headers.set(credential.name, `${credential.prefix || ''}${token}`);
    }
    resolvedCredentials.push({credential, token});
  }

  return {
    url: url.toString(),
    options: {...requestOptions, headers},
    credentials: resolvedCredentials
  };
}

/** Shares one in-flight refresh for concurrent requests using the same credential object. */
async function refreshCredential(
  credential: RequestCredential,
  url: string,
  response: Response
): Promise<string | null> {
  const existingPromise = refreshPromises.get(credential);
  if (existingPromise) return existingPromise;
  const tokenProvider = credential.token as TokenProvider;
  const promise = Promise.resolve(
    tokenProvider({
      url,
      reason: 'refresh',
      response: {status: response.status, headers: response.headers}
    })
  ).finally(() => refreshPromises.delete(credential));
  refreshPromises.set(credential, promise);
  return promise;
}

/** Resolves a static token or invokes an application token provider. */
async function resolveToken(
  token: TokenValue,
  context: TokenProviderContext
): Promise<string | null> {
  return typeof token === 'function' ? token(context) : token;
}

/** Validates and canonicalizes an exact-origin allowlist. */
function normalizeOrigins(origins: readonly string[]): string[] {
  if (!origins.length) throw new Error('Request credentials require at least one exact origin.');
  return origins.map(origin => {
    const url = new URL(origin);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error(`Credential origin must contain only scheme, host, and port: ${origin}`);
    }
    return url.origin;
  });
}

/** Parses an HTTP(S) URL without throwing for other fetch-compatible inputs. */
function parseHTTPURL(url: string): URL | null {
  try {
    const parsedURL = new URL(url);
    return ['http:', 'https:'].includes(parsedURL.protocol) ? parsedURL : null;
  } catch {
    return null;
  }
}

/** Returns whether a failed request can safely reuse its method and body once. */
function isReplayableRequest(options: RequestInit): boolean {
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method)) return false;
  return !(
    options.body &&
    typeof ReadableStream !== 'undefined' &&
    options.body instanceof ReadableStream
  );
}

/** Creates the standard DOM exception used for an aborted fetch. */
function createAbortError(): DOMException {
  return new DOMException('The operation was aborted.', 'AbortError');
}
