// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {JSONTableLoader} from '@loaders.gl/json';
import * as arrow from 'apache-arrow';

import {
  buildChromeTraceArrowSchemaMetadata,
  parseChromeTraceToArrowTable
} from './chrome-trace-arrow-parser';
import {tryParseChromeTraceFileText} from './chrome-trace-json-stream';
import {validateChromeTraceFile} from './chrome-trace-schema';
import {
  ChromeTraceLoader as ChromeTraceLoaderMetadata,
  type ChromeTraceLoaderOptions
} from './chrome-trace-loader-types';

import type {
  ChromeTraceEventArrowTable,
  ChromeTraceEventStreamArrowRecordBatch
} from './chrome-trace-arrow-schema';
import {chromeTraceEventStreamArrowSchema} from './chrome-trace-arrow-schema';
import type {ChromeTraceFileSchema, ChromeTraceValidationOptions} from './chrome-trace-schema';

const {preload: _preload, ...ChromeTraceLoaderMetadataWithoutPreload} = ChromeTraceLoaderMetadata;

/**
 * loaders.gl-compatible loader for Chrome trace JSON payloads.
 */
export const ChromeTraceLoaderWithParser = {
  ...ChromeTraceLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: ChromeTraceLoaderOptions) =>
    parseChromeTraceArrayBuffer(arrayBuffer, options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: ChromeTraceLoaderOptions) =>
    parseChromeTraceArrayBufferSync(arrayBuffer, options),
  parseText: async (text: string, options?: ChromeTraceLoaderOptions) =>
    parseChromeTraceText(text, options),
  parseTextSync: (text: string, options?: ChromeTraceLoaderOptions) =>
    parseChromeTraceTextSync(text, options),
  parseInBatches: async function* parseChromeTraceBatches(
    iterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ChromeTraceLoaderOptions
  ) {
    if (resolveChromeTraceLoaderShape(options) !== 'arrow-table') {
      throw new Error('ChromeTraceLoader.parseInBatches currently requires shape: "arrow-table".');
    }

    yield* parseChromeTraceArrowBatchesWithJSONTable(iterator, options);
  }
} as const satisfies LoaderWithParser<
  ChromeTraceFileSchema | ChromeTraceEventArrowTable,
  ChromeTraceEventStreamArrowRecordBatch,
  ChromeTraceLoaderOptions
>;

/**
 * Parses one Chrome trace binary payload asynchronously.
 */
function parseChromeTraceArrayBuffer(
  arrayBuffer: ArrayBuffer,
  options?: ChromeTraceLoaderOptions
): Promise<ChromeTraceFileSchema | ChromeTraceEventArrowTable> {
  return Promise.resolve(parseChromeTraceArrayBufferSync(arrayBuffer, options));
}

/**
 * Parses one Chrome trace binary payload synchronously.
 */
function parseChromeTraceArrayBufferSync(
  arrayBuffer: ArrayBuffer,
  options?: ChromeTraceLoaderOptions
): ChromeTraceFileSchema | ChromeTraceEventArrowTable {
  return parseChromeTraceTextSync(new TextDecoder().decode(new Uint8Array(arrayBuffer)), options);
}

/**
 * Parses one Chrome trace text payload asynchronously.
 */
function parseChromeTraceText(
  text: string,
  options?: ChromeTraceLoaderOptions
): Promise<ChromeTraceFileSchema | ChromeTraceEventArrowTable> {
  return Promise.resolve(parseChromeTraceTextSync(text, options));
}

/**
 * Parses one Chrome trace text payload synchronously.
 */
function parseChromeTraceTextSync(
  text: string,
  options?: ChromeTraceLoaderOptions
): ChromeTraceFileSchema | ChromeTraceEventArrowTable {
  if (resolveChromeTraceLoaderShape(options) === 'arrow-table') {
    return parseChromeTraceToArrowTable(text, {
      maxLength: options?.maxLength
    });
  }

  return validateChromeTraceFile(JSON.parse(text), resolveChromeTraceValidationOptions(options));
}

/**
 * Resolves the requested loader output shape.
 */
function resolveChromeTraceLoaderShape(
  options: ChromeTraceLoaderOptions | undefined
): 'json' | 'arrow-table' {
  const shape = options?.chromeTrace?.shape ?? options?.shape;
  return shape === 'arrow-table' ? 'arrow-table' : 'json';
}

/**
 * Resolves the requested Arrow batch size for streamed parsing.
 */
function resolveChromeTraceLoaderBatchSize(
  options: ChromeTraceLoaderOptions | undefined
): number | undefined {
  return (
    options?.chromeTrace?.batchSize ??
    (typeof options?.batchSize === 'number' ? options.batchSize : undefined)
  );
}

/**
 * Resolves the validation options shared with the JSON-first parser.
 */
function resolveChromeTraceValidationOptions(
  options: ChromeTraceLoaderOptions | undefined
): ChromeTraceValidationOptions {
  return {
    maxLength: options?.maxLength
  };
}

/**
 * Streams Chrome trace events through JSONTableLoader and emits direct Arrow record batches.
 */
async function* parseChromeTraceArrowBatchesWithJSONTable(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: ChromeTraceLoaderOptions
): AsyncIterable<ChromeTraceEventStreamArrowRecordBatch> {
  let rawText = '';
  let streamedMetadata: Pick<ChromeTraceFileSchema, 'displayTimeUnit' | 'metadata'> = {};
  let deferredBatch: ChromeTraceEventStreamArrowRecordBatch | null = null;

  const JSONTableLoaderWithParser = await JSONTableLoader.preload();
  const batches = JSONTableLoaderWithParser.parseInBatches(
    captureChromeTraceText(iterator, text => {
      rawText += text;
    }),
    {
      metadata: true,
      core: {
        batchSize: resolveChromeTraceLoaderBatchSize(options)
      },
      json: {
        backend: 'fast',
        shape: 'arrow-table',
        jsonpaths: ['$.traceEvents'],
        schema: chromeTraceEventStreamArrowSchema,
        arrowConversion: {
          onExtraField: 'drop',
          onMissingField: 'null',
          utf8Conversion: 'number-to-string'
        }
      }
    }
  );

  for await (const batch of batches) {
    if (batch.batchType === 'partial-result' || batch.batchType === 'final-result') {
      streamedMetadata = getChromeTraceMetadataFromContainer(batch.container) ?? streamedMetadata;
      continue;
    }

    if (batch.batchType !== 'data' || batch.shape !== 'arrow-table') {
      continue;
    }

    for (const recordBatch of batch.data.batches) {
      const metadataBatch = attachChromeTraceMetadataToRecordBatch(
        recordBatch as ChromeTraceEventStreamArrowRecordBatch,
        streamedMetadata
      );

      if (deferredBatch) {
        yield deferredBatch;
      }
      deferredBatch = metadataBatch;
    }
  }

  const completeTraceFile = tryParseChromeTraceFileText(rawText);
  const finalMetadata = completeTraceFile
    ? {
        displayTimeUnit: completeTraceFile.displayTimeUnit,
        metadata: completeTraceFile.metadata
      }
    : streamedMetadata;

  if (deferredBatch) {
    yield attachChromeTraceMetadataToRecordBatch(deferredBatch, finalMetadata);
  }
}

/**
 * Captures UTF-8 text alongside the binary iterator forwarded to JSONTableLoader.
 */
async function* captureChromeTraceText(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  onText: (text: string) => void
): AsyncIterable<ArrayBufferLike | ArrayBufferView> {
  for await (const chunk of iterator) {
    onText(decodeChromeTraceChunk(chunk));
    yield chunk;
  }
}

/**
 * Reads top-level Chrome trace stream metadata from a JSON parser container.
 */
function getChromeTraceMetadataFromContainer(
  container: unknown
): Pick<ChromeTraceFileSchema, 'displayTimeUnit' | 'metadata'> | null {
  if (!container || typeof container !== 'object') {
    return null;
  }

  const traceFile = container as Partial<ChromeTraceFileSchema>;
  return {
    ...(typeof traceFile.displayTimeUnit === 'string'
      ? {displayTimeUnit: traceFile.displayTimeUnit}
      : {}),
    ...(traceFile.metadata && typeof traceFile.metadata === 'object'
      ? {metadata: traceFile.metadata}
      : {})
  };
}

/**
 * Rebuilds one direct Chrome trace record batch with top-level trace metadata on its schema.
 */
function attachChromeTraceMetadataToRecordBatch(
  batch: ChromeTraceEventStreamArrowRecordBatch,
  traceFile: Pick<ChromeTraceFileSchema, 'displayTimeUnit' | 'metadata'>
): ChromeTraceEventStreamArrowRecordBatch {
  const metadata = buildChromeTraceArrowSchemaMetadata(traceFile);
  if (metadata.size === 0) {
    return batch;
  }

  const schema = new arrow.Schema(batch.schema.fields, metadata);
  return new arrow.RecordBatch(schema, batch.data) as ChromeTraceEventStreamArrowRecordBatch;
}

/**
 * Decodes one Chrome trace binary stream chunk into text for metadata recovery.
 */
function decodeChromeTraceChunk(chunk: ArrayBufferLike | ArrayBufferView): string {
  if (ArrayBuffer.isView(chunk)) {
    return new TextDecoder().decode(
      new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
    );
  }

  return new TextDecoder().decode(new Uint8Array(chunk));
}
