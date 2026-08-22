// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';

import {
  parseChromeTraceToArrowRecordBatches,
  parseChromeTraceToArrowTable
} from './chrome-trace-arrow-parser';
import {validateChromeTraceFile} from './chrome-trace-schema';
import {
  ChromeTraceLoader as ChromeTraceLoaderMetadata,
  type ChromeTraceLoaderOptions
} from './chrome-trace-loader-types';

import type {
  ChromeTraceEventArrowRecordBatch,
  ChromeTraceEventArrowTable
} from './chrome-trace-arrow-schema';
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

    yield* parseChromeTraceToArrowRecordBatches(iterator, {
      batchSize: resolveChromeTraceLoaderBatchSize(options),
      maxLength: options?.maxLength
    });
  }
} as const satisfies LoaderWithParser<
  ChromeTraceFileSchema | ChromeTraceEventArrowTable,
  ChromeTraceEventArrowRecordBatch,
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
