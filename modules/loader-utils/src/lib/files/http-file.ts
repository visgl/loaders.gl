// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile, Stat} from './file';
import type {RangeRequestTransportResult} from '../request-utils/range-request-scheduler';
import {RangeRequestScheduler} from '../request-utils/range-request-scheduler';
import type {HttpFileIdentity, HttpFileOptions, HttpFileTelemetry} from './http-file-types';
import {HttpFileTransport} from './http-file-transport';

export type {
  HttpFileConsistency,
  HttpFileFetch,
  HttpFileIdentity,
  HttpFileOptions,
  HttpFileTelemetry
} from './http-file-types';

/** A reusable, validator-aware, byte-range-addressable HTTP file. */
export class HttpFile implements ReadableFile {
  /** URL used as the ReadableFile handle. */
  readonly handle: string;
  /** Remote object URL. */
  readonly url: string;

  /** HTTP transport and response validator for this file. */
  private readonly transport: HttpFileTransport;
  /** Scheduler used to coalesce compatible range reads. */
  private readonly rangeScheduler: RangeRequestScheduler;
  /** Unique key that prevents coalescing across transport or credential contexts. */
  private readonly schedulerIsolationKey = {};
  /** Caller-supplied length available before identity discovery. */
  private readonly suppliedByteLength?: number;

  /** Pinned remote object identity. */
  private identity: HttpFileIdentity | null;
  /** Shared opening probe, while identity discovery is in progress. */
  private openPromise: Promise<HttpFileIdentity> | null = null;
  /** Whether the file has stopped accepting operations. */
  private closed = false;

  /** Creates a lazy HTTP file. Use {@link HttpFile.open} when identity must be pinned immediately. */
  constructor(url: string, options: HttpFileOptions = {}) {
    this.handle = url;
    this.url = url;
    this.transport = new HttpFileTransport(url, options);
    this.rangeScheduler =
      options.rangeScheduler ||
      new RangeRequestScheduler({batchDelayMs: 0, ...options.rangeSchedulerProps});
    this.suppliedByteLength = options.byteLength;
    this.identity = this.transport.getInitialIdentity();
  }

  /** Opens a file and pins its byte length and available validators. */
  static async open(
    url: string,
    options: HttpFileOptions = {},
    signal?: AbortSignal
  ): Promise<HttpFile> {
    const file = new HttpFile(url, options);
    await file.open(signal);
    return file;
  }

  /** Pins this file's byte length and available validators. */
  async open(signal?: AbortSignal): Promise<this> {
    this.assertOpen();
    if (signal?.aborted) {
      const error = createAbortError();
      this.transport.trackFailure(error);
      throw error;
    }
    await this.getIdentity(signal);
    return this;
  }

  /** Pinned file length, or zero before a lazy file has opened. */
  get size(): number {
    return this.identity?.byteLength ?? this.suppliedByteLength ?? 0;
  }

  /** Pinned file length as a bigint, or zero before a lazy file has opened. */
  get bigsize(): bigint {
    return BigInt(this.size);
  }

  /** Returns the pinned identity, or null before a lazy file has opened. */
  getIdentitySnapshot(): HttpFileIdentity | null {
    return this.identity;
  }

  /** Returns an immutable point-in-time copy of this file's transport counters. */
  getTelemetry(): HttpFileTelemetry {
    return this.transport.getTelemetry();
  }

  /** Prevents new operations. Active fetches remain controlled by their read signals. */
  async close(): Promise<void> {
    this.closed = true;
  }

  /** Returns pinned file information without issuing a HEAD request. */
  async stat(): Promise<Stat> {
    this.assertOpen();
    const identity = await this.getIdentity();
    return {
      size: identity.byteLength,
      bigsize: BigInt(identity.byteLength),
      isDirectory: false
    };
  }

  /** Reads exactly one byte range, with optional cancellation. */
  async read(
    offset: number | bigint = 0,
    length: number = 0,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    this.assertOpen();
    if (signal?.aborted) {
      const error = createAbortError();
      this.transport.trackFailure(error);
      throw error;
    }

    const identity = await this.getIdentity(signal);
    const numericOffset = normalizeOffset(offset);
    validateRange(numericOffset, length, identity.byteLength);
    if (length === 0) {
      return new ArrayBuffer(0);
    }

    try {
      return await this.rangeScheduler.scheduleRequest({
        sourceId: this.url,
        isolationKey: this.schedulerIsolationKey,
        offset: numericOffset,
        length,
        signal,
        fetchRange: this.fetchScheduledRange
      });
    } catch (error) {
      this.transport.trackFailure(error);
      throw error;
    }
  }

  /** Reads a range and returns a Response for legacy ReadableFile consumers. */
  async fetchRange(
    offset: number | bigint,
    length: number,
    signal?: AbortSignal
  ): Promise<Response> {
    const numericOffset = normalizeOffset(offset);
    const arrayBuffer = await this.read(numericOffset, length, signal);
    const headers = createIdentityHeaders(this.identity, numericOffset, length);
    return new Response(arrayBuffer, {status: 206, headers});
  }

  /** Stable scheduler callback used by every read from this file. */
  private readonly fetchScheduledRange = async (
    offset: number,
    length: number,
    signal?: AbortSignal
  ): Promise<RangeRequestTransportResult> => {
    const identity = await this.getIdentity(signal);
    const result = await this.transport.requestRange(offset, length, signal, identity);
    return {
      arrayBuffer: result.arrayBuffer,
      status: result.status,
      transportBytes: result.transportBytes,
      networkTimeMs: result.networkTimeMs
    };
  };

  /** Returns the shared lazy identity promise, retrying after a failed probe. */
  private getIdentity(signal?: AbortSignal): Promise<HttpFileIdentity> {
    if (this.identity) {
      return Promise.resolve(this.identity);
    }
    if (!this.openPromise) {
      // The shared probe must not be owned by the first caller's cancellation signal.
      // Each caller can independently stop waiting while the probe populates the cache.
      const nextOpenPromise = this.probeIdentity();
      const cachedOpenPromise = nextOpenPromise.catch(error => {
        if (this.openPromise === cachedOpenPromise) {
          this.openPromise = null;
        }
        throw error;
      });
      this.openPromise = cachedOpenPromise;
    }
    return waitForPromiseWithSignal(this.openPromise, signal).catch(error => {
      this.transport.trackFailure(error);
      throw error;
    });
  }

  /** Uses a one-byte GET range to discover object length and validators. */
  private async probeIdentity(): Promise<HttpFileIdentity> {
    try {
      const result = await this.transport.requestRange(0, 1, undefined, null);
      this.identity = result.identity;
      return result.identity;
    } catch (error) {
      this.transport.trackFailure(error);
      throw error;
    }
  }

  /** Throws when the file has been closed. */
  private assertOpen(): void {
    if (this.closed) {
      throw new Error('HttpFile is closed');
    }
  }
}

/** Creates the identity headers returned by the compatibility fetchRange method. */
function createIdentityHeaders(
  identity: HttpFileIdentity | null,
  offset: number,
  length: number
): Headers {
  const headers = new Headers();
  if (length > 0 && identity) {
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${identity.byteLength}`);
  }
  if (identity?.etag) {
    headers.set('ETag', identity.etag);
  }
  if (identity?.lastModified) {
    headers.set('Last-Modified', identity.lastModified);
  }
  return headers;
}

/** Converts and validates a number or bigint offset. */
function normalizeOffset(offset: number | bigint): number {
  const numericOffset = Number(offset);
  if (!Number.isSafeInteger(numericOffset) || numericOffset < 0) {
    throw new Error('HTTP byte-range offset must be a non-negative safe integer');
  }
  return numericOffset;
}

/** Validates a requested byte range against the pinned object length. */
function validateRange(offset: number, length: number, byteLength: number): void {
  if (!Number.isSafeInteger(length) || length < 0) {
    throw new Error('HTTP byte-range length must be a non-negative safe integer');
  }
  if (offset + length > byteLength) {
    throw new Error('HTTP byte range extends beyond the end of the file');
  }
}

/** Creates a conventional abort error without requiring DOMException in every host. */
function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('Request aborted', 'AbortError');
  }
  const error = new Error('Request aborted');
  error.name = 'AbortError';
  return error;
}

/** Lets one caller cancel its wait without cancelling a shared operation. */
function waitForPromiseWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return promise;
  }
  if (signal.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise<T>((resolve, reject) => {
    const abortListener = () => {
      signal.removeEventListener('abort', abortListener);
      reject(createAbortError());
    };
    signal.addEventListener('abort', abortListener, {once: true});
    promise.then(
      value => {
        signal.removeEventListener('abort', abortListener);
        resolve(value);
      },
      error => {
        signal.removeEventListener('abort', abortListener);
        reject(error);
      }
    );
  });
}
