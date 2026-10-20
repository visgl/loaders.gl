// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RangeRequestTransportResult} from '../request-utils/range-request-scheduler';
import type {
  HttpFileConsistency,
  HttpFileFetch,
  HttpFileIdentity,
  HttpFileOptions,
  HttpFileTelemetry
} from './http-file-types';

type MutableHttpFileTelemetry = {
  /** Bytes requested from HTTP. */
  requestedBytes: number;
  /** Response body bytes consumed. */
  downloadedBytes: number;
  /** HTTP requests started. */
  requestCount: number;
  /** Aggregate request duration. */
  networkTimeMs: number;
  /** Cancelled operations. */
  abortCount: number;
  /** Non-cancellation failures. */
  errorCount: number;
};

type HttpFileIdentityHints = {
  /** Expected object length, when supplied by the caller. */
  byteLength?: number;
  /** Expected ETag, when supplied by the caller. */
  etag?: string;
  /** Expected Last-Modified value, when supplied by the caller. */
  lastModified?: string;
};

type ParsedContentRange = {
  /** First returned byte. */
  offset: number;
  /** Last returned byte. */
  endOffset: number;
  /** Authoritative object length. */
  byteLength: number;
};

/** Result of one validated HTTP range request. */
export type HttpFileRangeResult = RangeRequestTransportResult & {
  /** Identity observed or confirmed by the response. */
  identity: HttpFileIdentity;
};

/** Owns HTTP request construction, response validation, identity checks, and transport telemetry. */
export class HttpFileTransport {
  /** Remote object URL. */
  private readonly url: string;
  /** Fetch implementation used for range requests. */
  private readonly fetchFunction: HttpFileFetch;
  /** Persistent fetch options copied from the caller. */
  private readonly fetchOptions?: RequestInit;
  /** Validator enforcement mode. */
  private readonly consistency: HttpFileConsistency;
  /** Caller-supplied identity information. */
  private readonly identityHints: HttpFileIdentityHints;
  /** Failure objects already included in telemetry. */
  private readonly countedFailures = new WeakSet<object>();
  /** Mutable counters backing immutable telemetry snapshots. */
  private readonly telemetry: MutableHttpFileTelemetry = {
    requestedBytes: 0,
    downloadedBytes: 0,
    requestCount: 0,
    networkTimeMs: 0,
    abortCount: 0,
    errorCount: 0
  };

  /** Creates the transport for one remote object. */
  constructor(url: string, options: HttpFileOptions) {
    validateKnownByteLength(options.byteLength);

    this.url = url;
    this.fetchFunction = options.fetch || ((input, init) => globalThis.fetch(input, init));
    this.fetchOptions = options.fetchOptions
      ? {...options.fetchOptions, headers: new Headers(options.fetchOptions.headers)}
      : undefined;
    this.consistency = options.consistency || 'best-effort';
    this.identityHints = {
      byteLength: options.byteLength,
      etag: normalizeHeaderValue(options.etag),
      lastModified: normalizeHeaderValue(options.lastModified)
    };
  }

  /** Returns an identity that is complete enough to avoid an opening request. */
  getInitialIdentity(): HttpFileIdentity | null {
    const {byteLength, etag, lastModified} = this.identityHints;
    if (byteLength !== undefined && (etag !== undefined || lastModified !== undefined)) {
      return createIdentity(byteLength, etag, lastModified);
    }
    if (byteLength === 0 && this.consistency === 'best-effort') {
      return createIdentity(0);
    }
    return null;
  }

  /** Returns an immutable point-in-time copy of the transport counters. */
  getTelemetry(): HttpFileTelemetry {
    return Object.freeze({...this.telemetry});
  }

  /** Counts each failure object once even when it passes through several async layers. */
  trackFailure(error: unknown): void {
    if (typeof error === 'object' && error !== null) {
      if (this.countedFailures.has(error)) {
        return;
      }
      this.countedFailures.add(error);
    }
    if (isAbortError(error)) {
      this.telemetry.abortCount++;
    } else {
      this.telemetry.errorCount++;
    }
  }

  /** Performs and validates one exact HTTP range request. */
  async requestRange(
    offset: number,
    length: number,
    signal: AbortSignal | undefined,
    expectedIdentity: HttpFileIdentity | null
  ): Promise<HttpFileRangeResult> {
    const requestStartTime = getTimestamp();
    const abortContext = createCombinedAbortContext(signal, this.fetchOptions?.signal);
    this.telemetry.requestCount++;
    this.telemetry.requestedBytes += length;

    try {
      const response = await this.fetchFunction(
        this.url,
        createFetchOptions(this.fetchOptions, offset, length, abortContext.signal)
      );
      if (isEmptyIdentityProbeResponse(response, offset, length, expectedIdentity)) {
        return await this.readEmptyIdentityProbe(response, requestStartTime);
      }
      if (response.status !== 206) {
        await cancelResponse(response);
        throw new Error(`HTTP byte-range request expected 206, received ${response.status}`);
      }

      const contentRange = await readContentRange(response);
      const responseIdentity = getResponseIdentity(response, contentRange.byteLength);
      const responseError =
        getIdentityError(
          expectedIdentity,
          responseIdentity,
          this.identityHints,
          this.consistency
        ) || getRangeError(contentRange, offset, length);
      if (responseError) {
        await cancelResponse(response);
        throw new Error(responseError);
      }

      const arrayBuffer = await response.arrayBuffer();
      this.telemetry.downloadedBytes += arrayBuffer.byteLength;
      if (arrayBuffer.byteLength !== length) {
        throw new Error(
          `HTTP byte-range response contained ${arrayBuffer.byteLength} bytes; expected ${length}`
        );
      }

      return {
        arrayBuffer,
        identity: resolveIdentity(expectedIdentity, responseIdentity, this.identityHints),
        status: response.status,
        transportBytes: arrayBuffer.byteLength,
        networkTimeMs: getTimestamp() - requestStartTime
      };
    } catch (error) {
      if (expectedIdentity === null || !isAbortError(error)) {
        this.trackFailure(error);
      }
      throw error;
    } finally {
      abortContext.removeAbortListeners();
      this.telemetry.networkTimeMs += getTimestamp() - requestStartTime;
    }
  }

  /** Validates and consumes the special empty-object identity response. */
  private async readEmptyIdentityProbe(
    response: Response,
    requestStartTime: number
  ): Promise<HttpFileRangeResult> {
    const responseIdentity = getResponseIdentity(response, 0);
    const identityError = getIdentityError(
      null,
      responseIdentity,
      this.identityHints,
      this.consistency
    );
    await cancelResponse(response);
    if (identityError) {
      throw new Error(identityError);
    }
    return {
      arrayBuffer: new ArrayBuffer(0),
      identity: resolveIdentity(null, responseIdentity, this.identityHints),
      status: response.status,
      transportBytes: 0,
      networkTimeMs: getTimestamp() - requestStartTime
    };
  }
}

/** Creates fetch options while preserving caller headers and forcing an exact GET range. */
function createFetchOptions(
  fetchOptions: RequestInit | undefined,
  offset: number,
  length: number,
  signal?: AbortSignal
): RequestInit {
  const headers = new Headers(fetchOptions?.headers);
  headers.set('Range', `bytes=${offset}-${offset + length - 1}`);
  return {
    ...fetchOptions,
    method: 'GET',
    body: undefined,
    headers,
    signal
  };
}

/** Returns whether a response is the valid empty-object form of an opening probe. */
function isEmptyIdentityProbeResponse(
  response: Response,
  offset: number,
  length: number,
  expectedIdentity: HttpFileIdentity | null
): boolean {
  return (
    response.status === 416 &&
    expectedIdentity === null &&
    offset === 0 &&
    length === 1 &&
    /^bytes \*\/0$/i.test(response.headers.get('Content-Range') || '')
  );
}

/** Parses Content-Range and cancels the body when the header is invalid. */
async function readContentRange(response: Response): Promise<ParsedContentRange> {
  try {
    return parseContentRange(response.headers.get('Content-Range'));
  } catch (error) {
    await cancelResponse(response);
    throw error;
  }
}

/** Parses an exact byte Content-Range response header. */
function parseContentRange(contentRange: string | null): ParsedContentRange {
  const match = contentRange?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
  if (!match) {
    throw new Error('HTTP byte-range response has an invalid Content-Range header');
  }
  return {
    offset: Number(match[1]),
    endOffset: Number(match[2]),
    byteLength: Number(match[3])
  };
}

/** Reads a normalized object identity from response headers. */
function getResponseIdentity(response: Response, byteLength: number): HttpFileIdentity {
  return createIdentity(
    byteLength,
    normalizeHeaderValue(response.headers.get('ETag')),
    normalizeHeaderValue(response.headers.get('Last-Modified'))
  );
}

/** Resolves the pinned identity from an expected identity, response, and caller hints. */
function resolveIdentity(
  expectedIdentity: HttpFileIdentity | null,
  responseIdentity: HttpFileIdentity,
  identityHints: HttpFileIdentityHints
): HttpFileIdentity {
  return (
    expectedIdentity ||
    createIdentity(
      responseIdentity.byteLength,
      responseIdentity.etag ?? identityHints.etag,
      responseIdentity.lastModified ?? identityHints.lastModified
    )
  );
}

/** Returns an error message when a response does not cover the requested range. */
function getRangeError(
  contentRange: ParsedContentRange,
  offset: number,
  length: number
): string | null {
  if (
    !Number.isSafeInteger(contentRange.offset) ||
    !Number.isSafeInteger(contentRange.endOffset) ||
    !Number.isSafeInteger(contentRange.byteLength) ||
    contentRange.offset < 0 ||
    contentRange.endOffset < contentRange.offset ||
    contentRange.endOffset >= contentRange.byteLength
  ) {
    return 'HTTP byte-range response has invalid range bounds';
  }
  if (contentRange.offset !== offset || contentRange.endOffset !== offset + length - 1) {
    return 'HTTP byte-range response does not match the requested range';
  }
  return null;
}

/** Returns an error message when response identity is inconsistent with the open file. */
function getIdentityError(
  expectedIdentity: HttpFileIdentity | null,
  responseIdentity: HttpFileIdentity,
  identityHints: HttpFileIdentityHints,
  consistency: HttpFileConsistency
): string | null {
  const expectedByteLength = expectedIdentity?.byteLength ?? identityHints.byteLength;
  if (expectedByteLength !== undefined && responseIdentity.byteLength !== expectedByteLength) {
    return 'HTTP file length changed while the file was open';
  }

  const expectedEtag = expectedIdentity?.etag ?? identityHints.etag;
  const expectedLastModified = expectedIdentity?.lastModified ?? identityHints.lastModified;
  if (expectedEtag) {
    if (responseIdentity.etag) {
      return expectedEtag === responseIdentity.etag
        ? null
        : 'HTTP file ETag changed while the file was open';
    }
    if (consistency === 'strict') {
      return 'HTTP byte-range response is missing the pinned ETag';
    }
    if (
      expectedLastModified &&
      responseIdentity.lastModified &&
      expectedLastModified !== responseIdentity.lastModified
    ) {
      return 'HTTP file Last-Modified value changed while the file was open';
    }
    return null;
  }
  if (expectedLastModified) {
    if (responseIdentity.lastModified && expectedLastModified !== responseIdentity.lastModified) {
      return 'HTTP file Last-Modified value changed while the file was open';
    }
    if (consistency === 'strict' && !responseIdentity.lastModified) {
      return 'HTTP byte-range response is missing the pinned Last-Modified value';
    }
    return null;
  }
  if (consistency === 'strict' && !responseIdentity.etag && !responseIdentity.lastModified) {
    return 'HTTP byte-range response does not provide an ETag or Last-Modified validator';
  }
  return null;
}

/** Creates a frozen normalized identity. */
function createIdentity(
  byteLength: number,
  etag?: string,
  lastModified?: string
): HttpFileIdentity {
  return Object.freeze({byteLength, etag, lastModified});
}

/** Validates a caller-provided object length. */
function validateKnownByteLength(byteLength?: number): void {
  if (byteLength !== undefined && (!Number.isSafeInteger(byteLength) || byteLength < 0)) {
    throw new Error('HttpFile byteLength must be a non-negative safe integer');
  }
}

/** Cancels a response body without obscuring the validation error. */
async function cancelResponse(response: Response): Promise<void> {
  await response.body?.cancel().catch(() => {});
}

/** Normalizes empty response-header values to undefined. */
function normalizeHeaderValue(value: string | null | undefined): string | undefined {
  return value || undefined;
}

/** Returns a high-resolution timestamp when available. */
function getTimestamp(): number {
  return globalThis.performance?.now() ?? Date.now();
}

/** Returns whether an arbitrary failure represents cancellation. */
function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (error instanceof Error && /aborted/i.test(error.message))
  );
}

/** Creates one fetch signal that follows both a per-read and persistent source signal. */
function createCombinedAbortContext(...signals: (AbortSignal | null | undefined)[]): {
  signal: AbortSignal;
  removeAbortListeners: () => void;
} {
  const abortController = new AbortController();
  const uniqueSignals = [
    ...new Set(signals.filter((signal): signal is AbortSignal => Boolean(signal)))
  ];
  const abortListener = () => abortController.abort();
  for (const signal of uniqueSignals) {
    if (signal.aborted) {
      abortController.abort();
    } else {
      signal.addEventListener('abort', abortListener, {once: true});
    }
  }
  return {
    signal: abortController.signal,
    removeAbortListeners: () => {
      for (const signal of uniqueSignals) {
        signal.removeEventListener('abort', abortListener);
      }
    }
  };
}
