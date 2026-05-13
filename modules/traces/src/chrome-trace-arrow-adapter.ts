// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseChromeTraceArrowSchemaMetadata} from './chrome-trace-arrow-parser';

import type {
  ChromeTraceEventArrowRecordBatch,
  ChromeTraceEventArrowTable
} from './chrome-trace-arrow-schema';
import type {ChromeTraceEventPhase, ChromeTraceEventSchema} from './chrome-trace-schema';

/**
 * One Arrow source item accepted by the Chrome trace streaming adapter.
 */
export type ChromeTraceArrowSourceItem =
  | ChromeTraceEventArrowRecordBatch
  | ChromeTraceEventArrowTable;

/**
 * Decodes Arrow-backed Chrome trace rows back into logical event objects.
 */
export function decodeChromeTraceArrowSource(
  source: ChromeTraceArrowSourceItem
): ChromeTraceEventSchema[] {
  const events: ChromeTraceEventSchema[] = [];

  for (const row of Array.from(source as Iterable<Record<string, unknown>>)) {
    const phase = getRequiredChromeTraceString(row.ph) as ChromeTraceEventPhase;
    const extra = parseChromeTraceArrowJson(row.extraJson) as Record<string, unknown> | undefined;

    const event: ChromeTraceEventSchema = {
      name: getRequiredChromeTraceString(row.name),
      ph: phase,
      pid: restoreChromeTraceIdLike(getOptionalChromeTraceString(row.pid), extra?.pid),
      tid: restoreChromeTraceIdLike(getOptionalChromeTraceString(row.tid), extra?.tid)
    };

    assignOptionalChromeTraceNumber(event, 'ts', getOptionalChromeTraceNumber(row.ts));
    assignOptionalChromeTraceString(event, 'cat', getOptionalChromeTraceString(row.cat));
    assignOptionalChromeTraceNumber(event, 'dur', getOptionalChromeTraceNumber(row.dur));
    assignOptionalChromeTraceNumber(event, 'tdur', getOptionalChromeTraceNumber(row.tdur));
    assignOptionalChromeTraceNumber(event, 'tts', getOptionalChromeTraceNumber(row.tts));

    const idValue = restoreOptionalChromeTraceIdLike(
      getOptionalChromeTraceString(row.id),
      extra?.id
    );
    if (idValue !== undefined) {
      event.id = idValue;
    }

    const bindIdValue = restoreOptionalChromeTraceIdLike(
      getOptionalChromeTraceString(row.bind_id),
      extra?.bind_id
    );
    if (bindIdValue !== undefined) {
      event.bind_id = bindIdValue;
    }

    const scopeValue = getOptionalChromeTraceString(row.scope);
    if (scopeValue) {
      if (phase === 'b' || phase === 'e' || phase === 'n') {
        event.s = scopeValue as 'g' | 'p' | 't';
      } else {
        event.scope = scopeValue as 'g' | 'p' | 't';
      }
    }

    const argsValue = parseChromeTraceArrowJson(row.args);
    if (argsValue != null) {
      event.args = argsValue as Record<string, unknown>;
    }

    if (extra) {
      Object.assign(event, extra);
    }

    events.push(event);
  }

  return events;
}

/**
 * Reads Chrome trace top-level metadata from one Arrow source item.
 */
export function readChromeTraceArrowSourceMetadata(source: ChromeTraceArrowSourceItem): {
  displayTimeUnit?: string;
  metadata?: Record<string, unknown>;
} {
  return parseChromeTraceArrowSchemaMetadata(source.schema.metadata);
}

/**
 * Reads one required string value from a decoded Arrow row.
 */
function getRequiredChromeTraceString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Chrome trace Arrow rows are missing required string data.');
  }
  return value;
}

/**
 * Reads one optional string from a decoded Arrow row.
 */
function getOptionalChromeTraceString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Reads one optional number from a decoded Arrow row.
 */
function getOptionalChromeTraceNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/**
 * Restores a string-or-number id-like value from the Arrow columns and passthrough JSON.
 */
function restoreChromeTraceIdLike(
  normalizedValue: string | undefined,
  extraValue: unknown
): string | number {
  if (typeof extraValue === 'number' || typeof extraValue === 'string') {
    return extraValue;
  }

  if (normalizedValue == null) {
    throw new Error('Chrome trace Arrow rows must include pid/tid values.');
  }

  return normalizedValue;
}

/**
 * Restores one optional id-like value from the Arrow columns and passthrough JSON.
 */
function restoreOptionalChromeTraceIdLike(
  normalizedValue: string | undefined,
  extraValue: unknown
): string | number | undefined {
  if (typeof extraValue === 'number' || typeof extraValue === 'string') {
    return extraValue;
  }

  return normalizedValue;
}

/**
 * Assigns one optional numeric field on the target event.
 */
function assignOptionalChromeTraceNumber(
  target: Record<string, unknown>,
  key: 'ts' | 'dur' | 'tdur' | 'tts',
  value: unknown
): void {
  if (typeof value === 'number') {
    target[key] = value;
  }
}

/**
 * Assigns one optional string field on the target event.
 */
function assignOptionalChromeTraceString(
  target: Record<string, unknown>,
  key: 'cat',
  value: string | undefined
): void {
  if (value != null) {
    target[key] = value;
  }
}

/**
 * Parses one optional JSON string stored in Arrow columns or metadata.
 */
function parseChromeTraceArrowJson(value: unknown): unknown {
  return typeof value === 'string' ? JSON.parse(value) : undefined;
}
