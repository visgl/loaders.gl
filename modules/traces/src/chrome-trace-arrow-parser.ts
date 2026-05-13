// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

import {chromeTraceEventArrowSchema} from './chrome-trace-arrow-schema';
import {
  appendChromeTraceFileChunk,
  createChromeTraceFileTokenizer,
  tryParseChromeTraceFileText
} from './chrome-trace-json-stream';
import {validateChromeTraceFile} from './chrome-trace-schema';

import type {
  ChromeTraceEventArrowColumns,
  ChromeTraceEventArrowRecordBatch,
  ChromeTraceEventArrowTable
} from './chrome-trace-arrow-schema';
import type {
  ChromeTraceEventSchema,
  ChromeTraceFileSchema,
  ChromeTraceValidationOptions
} from './chrome-trace-schema';

/**
 * Shared options for converting Chrome trace JSON payloads into Arrow events.
 */
export type ChromeTraceArrowParseOptions = ChromeTraceValidationOptions & {
  /** Maximum number of events emitted in one Arrow record batch. */
  batchSize?: number;
};

const CHROME_TRACE_ARROW_METADATA_DISPLAY_TIME_UNIT_KEY = 'chromeTrace.displayTimeUnit';
const CHROME_TRACE_ARROW_METADATA_JSON_KEY = 'chromeTrace.metadataJson';
const CHROME_TRACE_NUMERIC_ID_LIKE_KEYS = new Set(['pid', 'tid', 'id', 'bind_id']);
const CHROME_TRACE_MODELED_EXTRA_KEYS = new Set([
  'name',
  'ph',
  'ts',
  'pid',
  'tid',
  'cat',
  'dur',
  'tdur',
  'tts',
  'id',
  'bind_id',
  'args',
  'scope'
]);

/**
 * Parses one Chrome trace payload into a typed Arrow table of raw events.
 */
export function parseChromeTraceToArrowTable(
  source: string | ArrayBufferLike | ArrayBufferView | ChromeTraceFileSchema,
  options: ChromeTraceArrowParseOptions = {}
): ChromeTraceEventArrowTable {
  const traceFile = parseChromeTraceFile(source, options);
  return buildChromeTraceEventArrowTable(traceFile.traceEvents, traceFile);
}

/**
 * Parses a streamed Chrome trace payload into Arrow record batches of raw events.
 */
export async function* parseChromeTraceToArrowRecordBatches(
  source:
    | AsyncIterable<string | ArrayBufferLike | ArrayBufferView>
    | Iterable<string | ArrayBufferLike | ArrayBufferView>,
  options: ChromeTraceArrowParseOptions = {}
): AsyncIterable<ChromeTraceEventArrowRecordBatch> {
  const tokenizer = createChromeTraceFileTokenizer(undefined);
  const normalizedBatchSize = normalizeChromeTraceBatchSize(options.batchSize);
  const pendingEvents: ChromeTraceEventSchema[] = [];
  let deferredBatchEvents: ChromeTraceEventSchema[] | null = null;
  let rawText = '';
  let tokenizedEventCount = 0;

  for await (const chunk of source) {
    const chunkText = decodeChromeTraceSourceChunk(chunk);
    rawText += chunkText;

    const events = appendChromeTraceFileChunk(tokenizer, chunkText);
    if (events.length === 0) {
      continue;
    }

    tokenizedEventCount += events.length;
    pendingEvents.push(...events);

    while (pendingEvents.length >= normalizedBatchSize) {
      const batchEvents = pendingEvents.splice(0, normalizedBatchSize);
      if (deferredBatchEvents) {
        yield buildChromeTraceEventArrowRecordBatch(deferredBatchEvents, {
          displayTimeUnit: tokenizer.displayTimeUnit
        });
      }
      deferredBatchEvents = batchEvents;
    }
  }

  const parsedTraceFile = tryParseChromeTraceFileText(rawText);
  if (tokenizedEventCount === 0 && parsedTraceFile) {
    yield* emitChromeTraceArrowBatches(
      parsedTraceFile.traceEvents,
      {
        displayTimeUnit: parsedTraceFile.displayTimeUnit,
        metadata: parsedTraceFile.metadata
      },
      normalizedBatchSize
    );
    return;
  }

  const finalTraceFile = {
    displayTimeUnit: parsedTraceFile?.displayTimeUnit ?? tokenizer.displayTimeUnit,
    metadata: parsedTraceFile?.metadata
  };

  if (deferredBatchEvents) {
    if (pendingEvents.length === 0) {
      yield buildChromeTraceEventArrowRecordBatch(deferredBatchEvents, finalTraceFile);
    } else {
      yield buildChromeTraceEventArrowRecordBatch(deferredBatchEvents, {
        displayTimeUnit: tokenizer.displayTimeUnit
      });
    }
  }

  if (pendingEvents.length > 0) {
    yield buildChromeTraceEventArrowRecordBatch(pendingEvents, finalTraceFile);
  }
}

/**
 * Reads Chrome trace file metadata from one Arrow schema.
 */
export function parseChromeTraceArrowSchemaMetadata(metadata: Map<string, string>): {
  displayTimeUnit?: string;
  metadata?: Record<string, unknown>;
} {
  return {
    displayTimeUnit: metadata.get(CHROME_TRACE_ARROW_METADATA_DISPLAY_TIME_UNIT_KEY) ?? undefined,
    metadata: parseChromeTraceJsonValue(metadata.get(CHROME_TRACE_ARROW_METADATA_JSON_KEY)) as
      | Record<string, unknown>
      | undefined
  };
}

/**
 * Builds one typed Arrow table for a validated Chrome trace file.
 */
function buildChromeTraceEventArrowTable(
  events: readonly ChromeTraceEventSchema[],
  traceFile: Pick<ChromeTraceFileSchema, 'displayTimeUnit' | 'metadata'>
): ChromeTraceEventArrowTable {
  return new arrow.Table(
    buildChromeTraceEventArrowSchema(buildChromeTraceArrowSchemaMetadata(traceFile)),
    buildChromeTraceEventArrowColumns(events)
  );
}

/**
 * Builds one typed Arrow record batch for a validated Chrome trace event slice.
 */
function buildChromeTraceEventArrowRecordBatch(
  events: readonly ChromeTraceEventSchema[],
  traceFile: Pick<ChromeTraceFileSchema, 'displayTimeUnit' | 'metadata'>
): ChromeTraceEventArrowRecordBatch {
  const table = buildChromeTraceEventArrowTable(events, traceFile);
  const [batch] = table.batches;

  if (!batch) {
    throw new Error('Chrome trace Arrow record batches require at least one event.');
  }

  return batch as ChromeTraceEventArrowRecordBatch;
}

/**
 * Builds Arrow column vectors for one Chrome trace event slice.
 */
function buildChromeTraceEventArrowColumns(events: readonly ChromeTraceEventSchema[]): {
  [P in keyof ChromeTraceEventArrowColumns]: arrow.Vector<ChromeTraceEventArrowColumns[P]>;
} {
  return {
    name: arrow.vectorFromArray(
      events.map(event => event.name),
      new arrow.Utf8()
    ),
    ph: arrow.vectorFromArray(
      events.map(event => event.ph),
      new arrow.Utf8()
    ),
    ts: arrow.vectorFromArray(
      events.map(event => event.ts ?? null),
      new arrow.Float64()
    ),
    pid: arrow.vectorFromArray(
      events.map(event => normalizeChromeTraceIdLike(event.pid)),
      new arrow.Utf8()
    ),
    tid: arrow.vectorFromArray(
      events.map(event => normalizeChromeTraceIdLike(event.tid)),
      new arrow.Utf8()
    ),
    cat: arrow.vectorFromArray(
      events.map(event => event.cat ?? null),
      new arrow.Utf8()
    ),
    dur: arrow.vectorFromArray(
      events.map(event => event.dur ?? null),
      new arrow.Float64()
    ),
    tdur: arrow.vectorFromArray(
      events.map(event => event.tdur ?? null),
      new arrow.Float64()
    ),
    tts: arrow.vectorFromArray(
      events.map(event => event.tts ?? null),
      new arrow.Float64()
    ),
    id: arrow.vectorFromArray(
      events.map(event => normalizeChromeTraceIdLike(event.id)),
      new arrow.Utf8()
    ),
    bind_id: arrow.vectorFromArray(
      events.map(event => normalizeChromeTraceIdLike(event.bind_id)),
      new arrow.Utf8()
    ),
    scope: arrow.vectorFromArray(
      events.map(event => normalizeChromeTraceScope(event)),
      new arrow.Utf8()
    ),
    args: arrow.vectorFromArray(
      events.map(event => serializeChromeTraceJson(event.args)),
      new arrow.Utf8()
    ),
    extraJson: arrow.vectorFromArray(
      events.map(event => buildChromeTraceExtraJson(event)),
      new arrow.Utf8()
    )
  };
}

/**
 * Builds one Arrow schema instance with per-file metadata attached.
 */
function buildChromeTraceEventArrowSchema(
  metadata: Map<string, string>
): arrow.Schema<ChromeTraceEventArrowColumns> {
  return metadata.size > 0
    ? new arrow.Schema<ChromeTraceEventArrowColumns>(chromeTraceEventArrowSchema.fields, metadata)
    : chromeTraceEventArrowSchema;
}

/**
 * Builds Arrow schema metadata for one Chrome trace file.
 */
function buildChromeTraceArrowSchemaMetadata(
  traceFile: Pick<ChromeTraceFileSchema, 'displayTimeUnit' | 'metadata'>
): Map<string, string> {
  const metadata = new Map<string, string>();

  if (traceFile.displayTimeUnit) {
    metadata.set(CHROME_TRACE_ARROW_METADATA_DISPLAY_TIME_UNIT_KEY, traceFile.displayTimeUnit);
  }

  if (traceFile.metadata != null) {
    metadata.set(CHROME_TRACE_ARROW_METADATA_JSON_KEY, JSON.stringify(traceFile.metadata));
  }

  return metadata;
}

/**
 * Parses one source payload into a validated Chrome trace file.
 */
function parseChromeTraceFile(
  source: string | ArrayBufferLike | ArrayBufferView | ChromeTraceFileSchema,
  options: ChromeTraceValidationOptions
): ChromeTraceFileSchema {
  if (
    typeof source === 'object' &&
    !ArrayBuffer.isView(source) &&
    !(source instanceof ArrayBuffer)
  ) {
    return validateChromeTraceFile(source, options);
  }

  const text = decodeChromeTraceSourceChunk(source);
  return validateChromeTraceFile(JSON.parse(text), options);
}

/**
 * Decodes one Chrome trace source chunk into UTF-8 text.
 */
function decodeChromeTraceSourceChunk(chunk: string | ArrayBufferLike | ArrayBufferView): string {
  if (typeof chunk === 'string') {
    return chunk;
  }

  if (ArrayBuffer.isView(chunk)) {
    return new TextDecoder().decode(
      new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
    );
  }

  return new TextDecoder().decode(new Uint8Array(chunk));
}

/**
 * Normalizes one Chrome trace id-like field to a nullable string.
 */
function normalizeChromeTraceIdLike(value: string | number | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  return String(value);
}

/**
 * Normalizes the Chrome trace scope field while preserving async `s` values.
 */
function normalizeChromeTraceScope(event: ChromeTraceEventSchema): string | null {
  return event.scope ?? event.s ?? null;
}

/**
 * Serializes one optional JSON-safe value into a nullable string.
 */
function serializeChromeTraceJson(value: unknown): string | null {
  return value == null ? null : JSON.stringify(value);
}

/**
 * Builds the passthrough JSON payload for unmodeled fields and numeric id-like values.
 */
function buildChromeTraceExtraJson(event: ChromeTraceEventSchema): string | null {
  const extraEntries = Object.entries(event).filter(([key, value]) => {
    if (CHROME_TRACE_MODELED_EXTRA_KEYS.has(key)) {
      return CHROME_TRACE_NUMERIC_ID_LIKE_KEYS.has(key) && typeof value === 'number';
    }

    if (key === 's' && event.scope == null) {
      return false;
    }

    return true;
  });

  if (extraEntries.length === 0) {
    return null;
  }

  return JSON.stringify(Object.fromEntries(extraEntries));
}

/**
 * Parses one JSON string value used in Arrow schema metadata.
 */
function parseChromeTraceJsonValue(value: string | undefined): unknown {
  return value == null ? undefined : JSON.parse(value);
}

/**
 * Normalizes the requested Arrow batch size.
 */
function normalizeChromeTraceBatchSize(batchSize: number | undefined): number {
  if (!batchSize || !Number.isFinite(batchSize) || batchSize <= 0) {
    return 256;
  }

  return Math.max(1, Math.floor(batchSize));
}

/**
 * Emits one complete event list as Arrow record batches.
 */
async function* emitChromeTraceArrowBatches(
  events: readonly ChromeTraceEventSchema[],
  traceFile: Pick<ChromeTraceFileSchema, 'displayTimeUnit' | 'metadata'>,
  batchSize: number
): AsyncIterable<ChromeTraceEventArrowRecordBatch> {
  for (let startIndex = 0; startIndex < events.length; startIndex += batchSize) {
    const batchEvents = events.slice(startIndex, startIndex + batchSize);
    if (batchEvents.length === 0) {
      continue;
    }

    yield buildChromeTraceEventArrowRecordBatch(batchEvents, traceFile);
  }
}
