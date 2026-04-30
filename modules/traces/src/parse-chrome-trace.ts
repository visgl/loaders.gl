// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {validateChromeTraceFile} from './chrome-trace-schema';

import type {ChromeTraceValidationOptions} from './chrome-trace-schema';
import type {
  ChromeTrace,
  ChromeTraceCounter,
  ChromeTraceFlow,
  ChromeTraceInstant,
  ChromeTraceProcess,
  ChromeTraceSpan,
  ChromeTraceThread
} from './chrome-trace-types';

const DEFAULT_TIME_UNIT_TO_MS = 1 / 1000;
const TIME_UNIT_TO_MS: Record<string, number> = {
  ns: 1 / 1_000_000,
  nanoseconds: 1 / 1_000_000,
  μs: 1 / 1000,
  µs: 1 / 1000,
  us: 1 / 1000,
  microseconds: 1 / 1000,
  ms: 1,
  milliseconds: 1,
  s: 1000,
  seconds: 1000
};

type StackEntry = {
  /** Stable span identifier. */
  spanId: string;
  /** Stable track identifier. */
  trackId: string;
  /** Span name. */
  name: string;
  /** Start time in milliseconds. */
  startTimeMs: number;
  /** Optional begin-event payload. */
  userData?: Record<string, unknown>;
};

/**
 * Options supported by `parseChromeTrace`.
 */
export type ChromeTraceParseOptions = ChromeTraceValidationOptions;

/**
 * Parses one validated Chrome trace file into processes, threads, and events.
 */
export function parseChromeTrace(
  traceFile: unknown,
  options: ChromeTraceParseOptions = {}
): ChromeTrace {
  const validatedTraceFile = validateChromeTraceFile(traceFile, options);
  const timeUnitToMs = getTimeUnitToMs(validatedTraceFile.displayTimeUnit);
  const toMs = (value: number) => value * timeUnitToMs;

  const processes: Record<string, ChromeTraceProcess> = {};
  const threadsByTid: Record<string, Record<string, ChromeTraceThread>> = {};
  const stacks: Record<string, StackEntry[]> = {};

  for (const event of validatedTraceFile.traceEvents) {
    const processId = String(event.pid);
    const threadId = String(event.tid);
    const trackId = `${processId}:${threadId}`;

    if (!processes[processId]) {
      processes[processId] = {
        id: processId,
        label: processId,
        threads: []
      };
      threadsByTid[processId] = {};
    }

    let thread = threadsByTid[processId]?.[threadId];
    if (!thread) {
      thread = {
        id: trackId,
        pid: processId,
        tid: threadId,
        label: isNumericLabel(threadId) ? `Thread ${threadId}` : threadId,
        spans: [],
        instants: [],
        counters: [],
        flows: []
      };
      processes[processId].threads.push(thread);
      threadsByTid[processId][threadId] = thread;
    }

    const eventTimestamp = typeof event.ts === 'number' ? event.ts : event.ph === 'M' ? 0 : null;
    if (eventTimestamp == null) {
      continue;
    }

    const eventTimeMs = toMs(eventTimestamp);

    switch (event.ph) {
      case 'X':
        if (typeof event.dur === 'number') {
          thread.spans.push({
            spanId: `${trackId}:${event.name}:${eventTimestamp}`,
            trackId,
            name: event.name,
            startTimeMs: eventTimeMs,
            endTimeMs: eventTimeMs + toMs(event.dur),
            userData: event.args
          } satisfies ChromeTraceSpan);
        }
        break;

      case 'B':
        if (!stacks[trackId]) {
          stacks[trackId] = [];
        }

        stacks[trackId].push({
          spanId: `${trackId}:${event.name}:${eventTimestamp}`,
          trackId,
          name: event.name,
          startTimeMs: eventTimeMs,
          userData: event.args
        });
        break;

      case 'E': {
        const stack = stacks[trackId];
        if (!stack?.length) {
          break;
        }

        const begin = stack.pop()!;
        thread.spans.push({
          spanId: begin.spanId,
          trackId,
          name: begin.name,
          startTimeMs: begin.startTimeMs,
          endTimeMs: eventTimeMs,
          userData: begin.userData
        } satisfies ChromeTraceSpan);
        break;
      }

      case 'i':
      case 'I':
        thread.instants.push({
          id: `${trackId}:${event.name}:${eventTimestamp}`,
          trackId,
          name: event.name,
          atMs: eventTimeMs,
          scope: (event.scope ?? event.s ?? 't') as 'g' | 'p' | 't',
          userData: event.args
        } satisfies ChromeTraceInstant);
        break;

      case 'C':
        thread.counters.push({
          id: `${trackId}:${event.name}:${eventTimestamp}`,
          trackId,
          name: event.name,
          atMs: eventTimeMs,
          series: event.args ?? {},
          userData: event.args
        } satisfies ChromeTraceCounter);
        break;

      case 's':
      case 't':
      case 'f':
        thread.flows.push({
          id: `${trackId}:${event.name}:${eventTimestamp}`,
          bindId: String(event.bind_id ?? ''),
          kind: event.ph === 's' ? 'start' : event.ph === 't' ? 'step' : 'end',
          eventKey: `${trackId}:${event.name}`,
          trackId,
          atMs: eventTimeMs,
          name: event.name,
          userData: event.args
        } satisfies ChromeTraceFlow);
        break;

      case 'M': {
        const metadataName = getChromeTraceMetadataName(event.args);
        if (!metadataName) {
          break;
        }

        if (event.name === 'thread_name') {
          thread.label = metadataName;
        } else if (event.name === 'process_name') {
          processes[processId].label = metadataName;
        }
        break;
      }

      default:
        break;
    }
  }

  return {
    processes: Object.values(processes),
    metadata: validatedTraceFile.metadata
  };
}

/**
 * Returns whether a label consists only of digits.
 */
function isNumericLabel(label: string): boolean {
  return /^[0-9]+$/.test(label);
}

/**
 * Resolves one Chrome trace display time unit to milliseconds.
 */
function getTimeUnitToMs(displayTimeUnit?: string): number {
  if (!displayTimeUnit) {
    return DEFAULT_TIME_UNIT_TO_MS;
  }

  return TIME_UNIT_TO_MS[displayTimeUnit.trim().toLowerCase()] ?? DEFAULT_TIME_UNIT_TO_MS;
}

/**
 * Extracts one human-readable metadata label from a metadata event payload.
 */
function getChromeTraceMetadataName(args: Record<string, unknown> | undefined): string | undefined {
  if (typeof args?.name === 'string' && args.name.trim()) {
    return args.name.trim();
  }

  if (typeof args?.thread_name === 'string' && args.thread_name.trim()) {
    return args.thread_name.trim();
  }

  if (typeof args?.process_name === 'string' && args.process_name.trim()) {
    return args.process_name.trim();
  }

  return undefined;
}
