// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CoreAPI,
  DataSource,
  DataSourceOptions,
  FetchLike,
  RequestCredential,
  SourceLoader
} from '@loaders.gl/loader-utils';
import {createAuthenticatedFetch, redactCredentialURL} from '@loaders.gl/loader-utils';
import {CSWSourceLoader} from './csw-source-loader';
import {WMSSourceLoader} from './wms-source-loader';
import {WMTSSourceLoader} from './wmts-source-loader';
import {WFSSourceLoader} from './wfs-source-loader';
import {OGCAPIEDRSourceLoader} from './ogc-api-edr-source-loader';
import {OGCAPICoveragesSourceLoader} from './ogc-api-coverages-source-loader';
import {OGCAPIFeaturesSourceLoader, OGCAPITilesSourceLoader} from './ogc-api-source-loader';
import {WCSCoverageSourceLoader} from './wcs-source-loader';

/** A source loader that can be selected by the universal service runtime. */
export type ServiceSourceLoader = SourceLoader;

/** Runtime policy shared by service requests and source creation. */
export type ServiceRuntimeOptions = {
  /** Source loaders used for automatic URL detection. */
  loaders?: readonly ServiceSourceLoader[];
  /** Core API used by protocol sources to parse responses. */
  coreApi?: CoreAPI;
  /** Default request headers, including authorization headers. */
  headers?: HeadersInit;
  /** Exact-origin credentials applied to service and source requests. */
  credentials?: readonly RequestCredential[];
  /** Number of retries after retryable failures. */
  retries?: number;
  /** Delay between retries in milliseconds. */
  retryDelay?: number;
  /** Allows retries for non-idempotent methods when explicitly enabled. */
  retryNonIdempotent?: boolean;
  /** Time-to-live for cached sources. */
  cacheTTL?: number;
  /** Receives request lifecycle events. */
  onTelemetry?: (event: ServiceTelemetryEvent) => void;
};

/** A normalized service request lifecycle event. */
export type ServiceTelemetryEvent = {
  /** Lifecycle phase. */
  phase: 'start' | 'success' | 'error';
  /** Requested URL. */
  url: string;
  /** Attempt number, starting at one. */
  attempt: number;
  /** Elapsed time for completed requests. */
  elapsed?: number;
  /** Normalized error for failed requests. */
  error?: ServiceRequestError;
};

/** Error raised by a service request with retry context preserved. */
export class ServiceRequestError extends Error {
  /** Requested URL. */
  readonly url: string;
  /** HTTP status, when available. */
  readonly status?: number;
  /** Number of attempts made. */
  readonly attempts: number;

  /** Creates a normalized service request error. */
  constructor(url: string, attempts: number, status?: number, cause?: unknown) {
    super(`Service request failed after ${attempts} attempt${attempts === 1 ? '' : 's'}: ${url}`);
    this.name = 'ServiceRequestError';
    this.url = url;
    this.status = status;
    this.attempts = attempts;
    if (cause) this.cause = cause;
  }
}

/** Default source set spanning the OGC service families implemented by WMS. */
export const DEFAULT_SERVICE_LOADERS: readonly ServiceSourceLoader[] = [
  WMTSSourceLoader,
  WMSSourceLoader,
  WFSSourceLoader,
  WCSCoverageSourceLoader,
  OGCAPITilesSourceLoader,
  OGCAPICoveragesSourceLoader,
  OGCAPIEDRSourceLoader,
  OGCAPIFeaturesSourceLoader,
  CSWSourceLoader
];

type CachedSource = {source: DataSource<unknown, DataSourceOptions>; expires: number};

/** One protocol-neutral runtime for discovering and operating service sources. */
export class ServiceRuntime {
  /** Runtime options with resolved policy defaults. */
  readonly options: ServiceRuntimeOptions &
    Required<Pick<ServiceRuntimeOptions, 'loaders' | 'retries' | 'retryDelay' | 'cacheTTL'>>;
  private readonly _sources = new Map<string, CachedSource>();
  private readonly _fetch: FetchLike;

  /** Creates a universal service runtime. */
  constructor(options: ServiceRuntimeOptions = {}) {
    this.options = {
      ...options,
      loaders: options.loaders || DEFAULT_SERVICE_LOADERS,
      retries: options.retries ?? 2,
      retryDelay: options.retryDelay ?? 100,
      cacheTTL: options.cacheTTL ?? 300_000
    };
    this._fetch = createAuthenticatedFetch({credentials: options.credentials || []});
  }

  /** Detects a source type and creates a cached protocol source for a URL. */
  getSource(url: string, options: DataSourceOptions = {}): DataSource<unknown, DataSourceOptions> {
    const cachedSource = this._sources.get(url);
    if (cachedSource && cachedSource.expires > Date.now()) return cachedSource.source;
    const loader = this.options.loaders.find(candidate => candidate.testURL(url));
    if (!loader) throw new Error(`No geospatial service loader recognized URL: ${url}`);
    const sourceOptions = this._getSourceOptions(options);
    const source = loader.createDataSource(url, sourceOptions, this.options.coreApi);
    this._sources.set(url, {source, expires: Date.now() + this.options.cacheTTL});
    return source;
  }

  /** Requests a URL with shared headers, cancellation, retry, and telemetry behavior. */
  async request(url: string, requestInit: RequestInit = {}): Promise<Response> {
    const startedAt = Date.now();
    const diagnosticURL = redactCredentialURL(url, this.options.credentials || []);
    for (let attempt = 1; attempt <= this.options.retries + 1; attempt++) {
      this.options.onTelemetry?.({phase: 'start', url: diagnosticURL, attempt});
      try {
        const response = await this._fetch(url, {
          ...requestInit,
          headers: mergeHeaders(this.options.headers, requestInit.headers)
        });
        if (!response.ok) throw new ServiceRequestError(diagnosticURL, attempt, response.status);
        this.options.onTelemetry?.({
          phase: 'success',
          url: diagnosticURL,
          attempt,
          elapsed: Date.now() - startedAt
        });
        return response;
      } catch (error) {
        if (isAbortError(error) || requestInit.signal?.aborted) throw error;
        const normalizedError =
          error instanceof ServiceRequestError
            ? error
            : new ServiceRequestError(diagnosticURL, attempt, undefined, error);
        if (
          attempt > this.options.retries ||
          !isRetryableError(normalizedError) ||
          (!this.options.retryNonIdempotent && !isIdempotentMethod(requestInit.method))
        ) {
          this.options.onTelemetry?.({
            phase: 'error',
            url: diagnosticURL,
            attempt,
            elapsed: Date.now() - startedAt,
            error: normalizedError
          });
          throw normalizedError;
        }
        await delay(this.options.retryDelay * 2 ** (attempt - 1));
      }
    }
    throw new ServiceRequestError(diagnosticURL, this.options.retries + 1);
  }

  /** Clears cached source instances, optionally limiting invalidation to one URL. */
  clearCache(url?: string): void {
    if (url) this._sources.delete(url);
    else this._sources.clear();
  }

  private _getSourceOptions(options: DataSourceOptions): DataSourceOptions {
    if (!this.options.headers && !this.options.credentials?.length) return options;
    const loadOptions = options.core?.loadOptions || {};
    return {
      ...options,
      core: {
        ...options.core,
        loadOptions: {
          ...loadOptions,
          core: {
            ...loadOptions.core,
            credentials: [
              ...(loadOptions.core?.credentials || []),
              ...(this.options.credentials || [])
            ]
          },
          fetch: this.options.headers ? {headers: this.options.headers} : loadOptions.fetch
        }
      }
    };
  }
}

/** Combines HeadersInit values without losing Headers or tuple-array entries. */
function mergeHeaders(defaultHeaders?: HeadersInit, requestHeaders?: HeadersInit): Headers {
  const headers = new Headers(defaultHeaders);
  new Headers(requestHeaders).forEach((value, key) => headers.set(key, value));
  return headers;
}

/** Returns whether a request method is safe to retry by default. */
function isIdempotentMethod(method = 'GET'): boolean {
  return ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method.toUpperCase());
}

/** Returns whether an exception indicates request cancellation. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : (error as any)?.name === 'AbortError';
}

/** Determines whether a failed service request can be retried. */
function isRetryableError(error: ServiceRequestError): boolean {
  return (
    error.status === undefined ||
    error.status === 408 ||
    error.status === 425 ||
    error.status === 429 ||
    error.status >= 500
  );
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}
