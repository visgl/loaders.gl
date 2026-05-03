// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * One parsed Chrome trace grouped into processes and threads.
 */
export type ChromeTrace = {
  /** Parsed processes in the order they first appeared. */
  processes: ChromeTraceProcess[];
  /** Optional top-level trace metadata from the source file. */
  metadata?: Record<string, unknown>;
};

/**
 * One Chrome trace process.
 */
export type ChromeTraceProcess = {
  /** Stable process identifier. */
  id: string;
  /** Human-readable process label. */
  label: string;
  /** Parsed threads that belong to the process. */
  threads: ChromeTraceThread[];
};

/**
 * One Chrome trace thread.
 */
export type ChromeTraceThread = {
  /** Stable thread identifier. */
  id: string;
  /** Owning process identifier. */
  pid: string;
  /** Source thread identifier. */
  tid: string;
  /** Human-readable thread label. */
  label: string;
  /** Parsed duration spans for the thread. */
  spans: ChromeTraceSpan[];
  /** Parsed instant events for the thread. */
  instants: ChromeTraceInstant[];
  /** Parsed counters for the thread. */
  counters: ChromeTraceCounter[];
  /** Parsed flows for the thread. */
  flows: ChromeTraceFlow[];
};

/**
 * One parsed span with start and end times in milliseconds.
 */
export type ChromeTraceSpan = {
  /** Stable span identifier. */
  spanId: string;
  /** Stable thread track identifier. */
  trackId: string;
  /** Span name. */
  name: string;
  /** Inclusive start time in milliseconds. */
  startTimeMs: number;
  /** Exclusive end time in milliseconds. */
  endTimeMs: number;
  /** Optional user payload from the source event. */
  userData?: Record<string, unknown>;
};

/**
 * One parsed instant event.
 */
export type ChromeTraceInstant = {
  /** Stable instant identifier. */
  id: string;
  /** Stable thread track identifier. */
  trackId: string;
  /** Instant name. */
  name: string;
  /** Instant timestamp in milliseconds. */
  atMs: number;
  /** Instant scope. */
  scope: 'g' | 'p' | 't';
  /** Optional user payload from the source event. */
  userData?: Record<string, unknown>;
};

/**
 * One parsed counter event.
 */
export type ChromeTraceCounter = {
  /** Stable counter identifier. */
  id: string;
  /** Stable thread track identifier. */
  trackId: string;
  /** Counter name. */
  name: string;
  /** Counter timestamp in milliseconds. */
  atMs: number;
  /** Counter series payload. */
  series: Record<string, unknown>;
  /** Optional user payload from the source event. */
  userData?: Record<string, unknown>;
};

/**
 * One parsed flow event.
 */
export type ChromeTraceFlow = {
  /** Stable flow identifier. */
  id: string;
  /** Optional bind identifier associated with the flow. */
  bindId: string;
  /** Flow event kind. */
  kind: 'start' | 'step' | 'end';
  /** Stable key that groups related flow events. */
  eventKey: string;
  /** Optional track identifier for the flow event. */
  trackId?: string;
  /** Flow timestamp in milliseconds. */
  atMs: number;
  /** Optional flow label. */
  name?: string;
  /** Optional user payload from the source event. */
  userData?: Record<string, unknown>;
};
