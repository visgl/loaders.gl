// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  RangeRequestScheduler,
  RangeRequestSchedulerProps
} from '../request-utils/range-request-scheduler';

/** Controls how rigorously an HTTP file verifies response validators. */
export type HttpFileConsistency = 'strict' | 'best-effort';

/** Fetch implementation accepted by `HttpFile`. */
export type HttpFileFetch = (url: string, options?: RequestInit) => Promise<Response>;

/** Options for opening a byte-range-addressable HTTP file. */
export type HttpFileOptions = {
  /** Optional fetch implementation. */
  fetch?: HttpFileFetch;
  /** Fetch options applied to every request. The Range header and signal are supplied per read. */
  fetchOptions?: RequestInit;
  /** Known object length. Supplying a validator as well avoids an opening probe request. */
  byteLength?: number;
  /** Known object ETag. */
  etag?: string;
  /** Known object Last-Modified value. */
  lastModified?: string;
  /** Whether missing validators are rejected. Defaults to best-effort. */
  consistency?: HttpFileConsistency;
  /** Optional shared byte-range scheduler. */
  rangeScheduler?: RangeRequestScheduler;
  /** Configuration used when creating a private scheduler. */
  rangeSchedulerProps?: RangeRequestSchedulerProps;
};

/** Immutable identity pinned for an open HTTP file. */
export type HttpFileIdentity = Readonly<{
  /** Authoritative object length in bytes. */
  byteLength: number;
  /** Pinned ETag, when exposed by the server. */
  etag?: string;
  /** Pinned Last-Modified value, when exposed by the server. */
  lastModified?: string;
}>;

/** Immutable snapshot of one HTTP file's transport counters. */
export type HttpFileTelemetry = Readonly<{
  /** Bytes requested from HTTP after range coalescing, including the opening probe. */
  requestedBytes: number;
  /** Response body bytes consumed by the file. */
  downloadedBytes: number;
  /** Actual HTTP requests started by the file. */
  requestCount: number;
  /** Aggregate wall time spent awaiting HTTP requests and response bodies. */
  networkTimeMs: number;
  /** Failed or cancelled operations caused by an abort signal. */
  abortCount: number;
  /** Failed operations not caused by cancellation. */
  errorCount: number;
}>;
