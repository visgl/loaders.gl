// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  decodeChromeTraceArrowSource,
  readChromeTraceArrowSourceMetadata
} from './chrome-trace-arrow-adapter';
import {parseChromeTraceToArrowRecordBatches} from './chrome-trace-arrow-parser';
import {parseChromeTrace} from './parse-chrome-trace';
import {createTraceStreamReplaceChunk} from './trace-stream-session';

import type {ChromeTraceArrowParseOptions} from './chrome-trace-arrow-parser';
import type {ChromeTraceArrowSourceItem} from './chrome-trace-arrow-adapter';
import type {ChromeTraceEventSchema, ChromeTraceFileSchema} from './chrome-trace-schema';
import type {ChromeTraceParseOptions} from './parse-chrome-trace';
import type {
  TraceStreamChunk,
  TraceStreamPublishedSnapshot,
  TraceStreamSession
} from './trace-stream-session';

/**
 * One item yielded by a parsed Chrome event async stream.
 */
export type ChromeTraceEventStreamItem =
  | ChromeTraceEventSchema
  | ReadonlyArray<ChromeTraceEventSchema>;

/**
 * Shared options for Chrome trace streaming helpers.
 */
export type ChromeTraceStreamOptions = ChromeTraceParseOptions &
  ChromeTraceArrowParseOptions & {
    /** Human-readable trace name used in replacement snapshots. */
    name?: string;
    /** Explicit display time unit used before streamed metadata is discovered. */
    displayTimeUnit?: string;
    /** Explicit top-level metadata used before streamed metadata is discovered. */
    metadata?: Record<string, unknown>;
    /** Event threshold that triggers one replacement publish. */
    publishEveryEvents?: number;
  };

type ChromeTraceAccumulatorState = {
  /** Human-readable replacement snapshot name. */
  name: string;
  /** Accumulated logical Chrome trace events. */
  events: ChromeTraceEventSchema[];
  /** Optional display time unit resolved from the stream. */
  displayTimeUnit?: string;
  /** Optional top-level metadata resolved from the stream. */
  metadata?: Record<string, unknown>;
  /** Event threshold for replacement publishes. */
  publishEveryEvents: number;
  /** Number of events added since the previous publish. */
  eventsSincePublish: number;
  /** Parse options reused for every replacement publish. */
  parseOptions: ChromeTraceParseOptions;
};

/**
 * Builds replacement chunks from a parsed Chrome trace event stream.
 */
export async function* streamChromeTraceEventChunks(
  source: AsyncIterable<ChromeTraceEventStreamItem>,
  options: ChromeTraceStreamOptions = {}
): AsyncIterable<TraceStreamChunk> {
  const state = createChromeTraceAccumulator(options);

  for await (const item of source) {
    const events = Array.isArray(item) ? item : [item];
    appendChromeTraceEvents(state, events);

    if (state.eventsSincePublish >= state.publishEveryEvents) {
      const chunk = buildChromeTraceAccumulatorChunk(state);
      if (chunk) {
        yield chunk;
      }
    }
  }

  const finalChunk = buildChromeTraceAccumulatorChunk(state);
  if (finalChunk) {
    yield finalChunk;
  }
}

/**
 * Builds replacement chunks from an Arrow-backed Chrome trace event stream.
 */
export async function* streamChromeTraceArrowChunks(
  source: AsyncIterable<ChromeTraceArrowSourceItem>,
  options: ChromeTraceStreamOptions = {}
): AsyncIterable<TraceStreamChunk> {
  const state = createChromeTraceAccumulator(options);

  for await (const item of source) {
    const metadata = readChromeTraceArrowSourceMetadata(item);
    state.displayTimeUnit = metadata.displayTimeUnit ?? state.displayTimeUnit;
    state.metadata = metadata.metadata ?? state.metadata;

    appendChromeTraceEvents(state, decodeChromeTraceArrowSource(item));

    if (state.eventsSincePublish >= state.publishEveryEvents) {
      const chunk = buildChromeTraceAccumulatorChunk(state);
      if (chunk) {
        yield chunk;
      }
    }
  }

  const finalChunk = buildChromeTraceAccumulatorChunk(state);
  if (finalChunk) {
    yield finalChunk;
  }
}

/**
 * Builds replacement chunks from a chunked Chrome trace JSON file stream.
 */
export async function* streamChromeTraceFileChunks(
  source: AsyncIterable<string | ArrayBufferLike | ArrayBufferView>,
  options: ChromeTraceStreamOptions = {}
): AsyncIterable<TraceStreamChunk> {
  const arrowSource = parseChromeTraceToArrowRecordBatches(source, {
    batchSize: options.batchSize,
    maxLength: options.maxLength
  });

  yield* streamChromeTraceArrowChunks(arrowSource, options);
}

/**
 * Consumes a parsed Chrome trace event stream into one live trace session.
 */
export async function consumeChromeTraceEventStream(
  session: TraceStreamSession,
  source: AsyncIterable<ChromeTraceEventStreamItem>,
  options: ChromeTraceStreamOptions = {}
): Promise<TraceStreamPublishedSnapshot | null> {
  let latestSnapshot: TraceStreamPublishedSnapshot | null = null;

  for await (const chunk of streamChromeTraceEventChunks(source, options)) {
    session.applyChunk(chunk);
    latestSnapshot = session.publishSnapshot() ?? latestSnapshot;
  }

  return latestSnapshot ?? session.publishSnapshot();
}

/**
 * Consumes an Arrow-backed Chrome trace stream into one live trace session.
 */
export async function consumeChromeTraceArrowStream(
  session: TraceStreamSession,
  source: AsyncIterable<ChromeTraceArrowSourceItem>,
  options: ChromeTraceStreamOptions = {}
): Promise<TraceStreamPublishedSnapshot | null> {
  let latestSnapshot: TraceStreamPublishedSnapshot | null = null;

  for await (const chunk of streamChromeTraceArrowChunks(source, options)) {
    session.applyChunk(chunk);
    latestSnapshot = session.publishSnapshot() ?? latestSnapshot;
  }

  return latestSnapshot ?? session.publishSnapshot();
}

/**
 * Consumes a chunked Chrome trace JSON file stream into one live trace session.
 */
export async function consumeChromeTraceFileStream(
  session: TraceStreamSession,
  source: AsyncIterable<string | ArrayBufferLike | ArrayBufferView>,
  options: ChromeTraceStreamOptions = {}
): Promise<TraceStreamPublishedSnapshot | null> {
  let latestSnapshot: TraceStreamPublishedSnapshot | null = null;

  for await (const chunk of streamChromeTraceFileChunks(source, options)) {
    session.applyChunk(chunk);
    latestSnapshot = session.publishSnapshot() ?? latestSnapshot;
  }

  return latestSnapshot ?? session.publishSnapshot();
}

/**
 * Creates one mutable accumulator used by the Chrome streaming helpers.
 */
function createChromeTraceAccumulator(
  options: ChromeTraceStreamOptions
): ChromeTraceAccumulatorState {
  return {
    name: options.name ?? 'Chrome Trace Live Stream',
    events: [],
    displayTimeUnit: options.displayTimeUnit,
    metadata: options.metadata,
    publishEveryEvents: normalizeChromeTracePublishEveryEvents(options.publishEveryEvents),
    eventsSincePublish: 0,
    parseOptions: options
  };
}

/**
 * Appends parsed logical Chrome events into the shared accumulator.
 */
function appendChromeTraceEvents(
  state: ChromeTraceAccumulatorState,
  events: ReadonlyArray<ChromeTraceEventSchema>
): void {
  if (events.length === 0) {
    return;
  }

  state.events.push(...events);
  state.eventsSincePublish += events.length;
}

/**
 * Builds one immutable replacement chunk from the accumulated Chrome events.
 */
function buildChromeTraceAccumulatorChunk(
  state: ChromeTraceAccumulatorState
): TraceStreamChunk | null {
  if (state.events.length === 0) {
    return null;
  }

  const traceFile: ChromeTraceFileSchema = {
    traceEvents: state.events,
    ...(state.displayTimeUnit ? {displayTimeUnit: state.displayTimeUnit} : {}),
    ...(state.metadata ? {metadata: state.metadata} : {})
  };
  const trace = parseChromeTrace(traceFile, state.parseOptions);
  const chunk = createTraceStreamReplaceChunk({
    name: state.name,
    trace,
    traceFile
  });

  state.eventsSincePublish = 0;
  return chunk;
}

/**
 * Normalizes the incremental publish threshold.
 */
function normalizeChromeTracePublishEveryEvents(publishEveryEvents: number | undefined): number {
  if (
    publishEveryEvents == null ||
    !Number.isFinite(publishEveryEvents) ||
    publishEveryEvents <= 0
  ) {
    return 256;
  }

  return Math.max(1, Math.floor(publishEveryEvents));
}
