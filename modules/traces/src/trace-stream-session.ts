// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ChromeTrace} from './chrome-trace-types';
import type {ChromeTraceFileSchema} from './chrome-trace-schema';

/**
 * Full immutable replacement payload applied by one streamed chunk.
 */
export type TraceStreamReplaceSnapshot = {
  /** Human-readable trace name. */
  name: string;
  /** Parsed Chrome trace graph. */
  trace: ChromeTrace;
  /** Canonical trace file assembled from the stream so far. */
  traceFile: ChromeTraceFileSchema;
};

/**
 * Normalized streaming chunk applied into one live trace session.
 */
export type TraceStreamChunk = {
  /** Optional session name override. */
  name?: string;
  /** Optional full-state replacement snapshot. */
  replaceSnapshot?: TraceStreamReplaceSnapshot;
};

/**
 * Immutable snapshot published by a live trace session.
 */
export type TraceStreamPublishedSnapshot = {
  /** Monotonic snapshot sequence. */
  sequence: number;
  /** Human-readable trace name. */
  name: string;
  /** Parsed Chrome trace graph. */
  trace: ChromeTrace;
  /** Canonical trace file assembled from the stream. */
  traceFile: ChromeTraceFileSchema;
};

/**
 * Listener invoked when a live trace session publishes a new snapshot.
 */
export type TraceStreamSessionListener = (
  snapshot: TraceStreamPublishedSnapshot
) => void | Promise<void>;

/**
 * Options for creating one live trace session.
 */
export type TraceStreamSessionOptions = {
  /** Human-readable session name used until a chunk overrides it. */
  name?: string;
  /** Minimum delay before a scheduled publish flushes dirty state. */
  publishIntervalMs?: number;
};

/**
 * Mutable live trace session that accepts replacement chunks and publishes immutable snapshots.
 */
export type TraceStreamSession = {
  /** Applies one normalized chunk into mutable session state. */
  applyChunk: (chunk: TraceStreamChunk) => void;
  /** Forces publication of the latest dirty state. */
  publishSnapshot: () => TraceStreamPublishedSnapshot | null;
  /** Reads the latest published immutable snapshot. */
  getPublishedSnapshot: () => TraceStreamPublishedSnapshot | null;
  /** Subscribes to published snapshots. */
  subscribe: (listener: TraceStreamSessionListener) => () => void;
  /** Closes the session and cancels any pending scheduled publish. */
  close: () => void;
};

type TraceStreamSessionState = {
  /** Human-readable session name. */
  name: string;
  /** Minimum publish interval. */
  publishIntervalMs: number;
  /** Whether the session has been closed. */
  closed: boolean;
  /** Whether mutable state differs from the latest published snapshot. */
  dirty: boolean;
  /** Monotonic published sequence. */
  sequence: number;
  /** Latest replacement snapshot staged for publication. */
  replacementSnapshot: TraceStreamReplaceSnapshot | null;
  /** Latest published immutable snapshot. */
  publishedSnapshot: TraceStreamPublishedSnapshot | null;
  /** Pending publish timer. */
  publishTimer: ReturnType<typeof setTimeout> | null;
  /** Snapshot listeners. */
  listeners: Set<TraceStreamSessionListener>;
};

/**
 * Creates one live trace session.
 */
export function createTraceStreamSession(
  options: TraceStreamSessionOptions = {}
): TraceStreamSession {
  const state = createTraceStreamSessionState(options);

  return {
    applyChunk: chunk => {
      assertTraceStreamSessionOpen(state);
      applyTraceStreamChunk(state, chunk);
      scheduleTraceStreamPublish(state);
    },
    publishSnapshot: () => {
      assertTraceStreamSessionOpen(state);
      return publishTraceStreamSnapshot(state);
    },
    getPublishedSnapshot: () => state.publishedSnapshot,
    subscribe: listener => {
      assertTraceStreamSessionOpen(state);
      state.listeners.add(listener);

      if (state.publishedSnapshot) {
        void listener(state.publishedSnapshot);
      }

      return () => {
        state.listeners.delete(listener);
      };
    },
    close: () => {
      if (state.publishTimer != null) {
        clearTimeout(state.publishTimer);
      }

      state.publishTimer = null;
      state.closed = true;
      state.listeners.clear();
    }
  };
}

/**
 * Creates one full replacement chunk from an immutable snapshot payload.
 */
export function createTraceStreamReplaceChunk(
  snapshot: TraceStreamReplaceSnapshot
): TraceStreamChunk {
  return {
    name: snapshot.name,
    replaceSnapshot: snapshot
  };
}

/**
 * Creates mutable state for one live trace session.
 */
function createTraceStreamSessionState(
  options: TraceStreamSessionOptions
): TraceStreamSessionState {
  return {
    name: options.name ?? 'Live Trace',
    publishIntervalMs: normalizeTraceStreamPublishIntervalMs(options.publishIntervalMs),
    closed: false,
    dirty: false,
    sequence: 0,
    replacementSnapshot: null,
    publishedSnapshot: null,
    publishTimer: null,
    listeners: new Set()
  };
}

/**
 * Applies one normalized chunk into mutable session state.
 */
function applyTraceStreamChunk(state: TraceStreamSessionState, chunk: TraceStreamChunk): void {
  if (chunk.name) {
    state.name = chunk.name;
  }

  if (chunk.replaceSnapshot) {
    state.name = chunk.replaceSnapshot.name;
    state.replacementSnapshot = chunk.replaceSnapshot;
    state.dirty = true;
  }
}

/**
 * Schedules one delayed publish when state is dirty.
 */
function scheduleTraceStreamPublish(state: TraceStreamSessionState): void {
  if (!state.dirty || state.publishTimer != null || state.closed) {
    return;
  }

  state.publishTimer = setTimeout(() => {
    state.publishTimer = null;
    publishTraceStreamSnapshot(state);
  }, state.publishIntervalMs);
}

/**
 * Publishes the latest replacement snapshot when state is dirty.
 */
function publishTraceStreamSnapshot(
  state: TraceStreamSessionState
): TraceStreamPublishedSnapshot | null {
  if (!state.replacementSnapshot) {
    return state.publishedSnapshot;
  }

  if (!state.dirty && state.publishedSnapshot) {
    return state.publishedSnapshot;
  }

  const snapshot: TraceStreamPublishedSnapshot = {
    sequence: state.sequence + 1,
    name: state.replacementSnapshot.name || state.name,
    trace: state.replacementSnapshot.trace,
    traceFile: state.replacementSnapshot.traceFile
  };

  state.sequence = snapshot.sequence;
  state.publishedSnapshot = snapshot;
  state.dirty = false;

  for (const listener of state.listeners) {
    void listener(snapshot);
  }

  return snapshot;
}

/**
 * Normalizes the configured publish interval.
 */
function normalizeTraceStreamPublishIntervalMs(publishIntervalMs: number | undefined): number {
  if (publishIntervalMs == null || !Number.isFinite(publishIntervalMs) || publishIntervalMs < 0) {
    return 16;
  }

  return Math.floor(publishIntervalMs);
}

/**
 * Throws when a closed session is used again.
 */
function assertTraceStreamSessionOpen(state: TraceStreamSessionState): void {
  if (state.closed) {
    throw new Error('TraceStreamSession has already been closed.');
  }
}
