// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';

import type {OtlpTrace, OtlpTraceBatch} from './otlp-trace-arrow-schema';
import {emitOtlpTraceBatches, normalizeOtlpBatchSize} from './otlp-trace-batches';
import {
  ZipkinTraceLoader as ZipkinTraceLoaderMetadata,
  type ZipkinTraceLoaderOptions
} from './zipkin-trace-loader-types';
import {parseZipkinTraceJson} from './zipkin-trace-parser';

const {preload: _preload, ...ZipkinTraceLoaderMetadataWithoutPreload} = ZipkinTraceLoaderMetadata;

/** Parser-bearing loader for Zipkin v2 JSON and JSON Lines traces. */
export const ZipkinTraceLoaderWithParser = {
  ...ZipkinTraceLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseZipkinTraceJson(decodeBytes(arrayBuffer)),
  parseSync: (arrayBuffer: ArrayBuffer) => parseZipkinTraceJson(decodeBytes(arrayBuffer)),
  parseText: async (text: string) => parseZipkinTraceJson(text),
  parseTextSync: (text: string) => parseZipkinTraceJson(text),
  parseInBatches: parseZipkinTraceInBatches
} as const satisfies LoaderWithParser<OtlpTrace, OtlpTraceBatch, ZipkinTraceLoaderOptions>;

/** Parses chunked Zipkin JSON into tagged Arrow batches. */
async function* parseZipkinTraceInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: ZipkinTraceLoaderOptions
): AsyncIterable<OtlpTraceBatch> {
  const decoder = new TextDecoder();
  const batchSize = normalizeOtlpBatchSize(options?.zipkinTrace?.batchSize);
  let pendingText = '';
  let documentText: string | null = null;
  let parsedLineCount = 0;
  let resourceId = 0;
  let scopeId = 0;

  for await (const chunk of iterator) {
    const decodedText = decoder.decode(getBytes(chunk), {stream: true});
    if (documentText !== null) {
      documentText += decodedText;
      continue;
    }
    pendingText += decodedText;
    let newlineIndex = pendingText.indexOf('\n');
    while (newlineIndex >= 0) {
      const line = pendingText.slice(0, newlineIndex).replace(/\r$/, '');
      pendingText = pendingText.slice(newlineIndex + 1);
      if (line.trim()) {
        try {
          const trace = parseZipkinTraceJson(line, {resourceId, scopeId});
          resourceId += trace.resources.numRows;
          scopeId += trace.scopes.numRows;
          parsedLineCount++;
          yield* emitOtlpTraceBatches(trace, batchSize);
        } catch (error) {
          if (parsedLineCount > 0) {
            throw error;
          }
          documentText = `${line}\n${pendingText}`;
          pendingText = '';
          break;
        }
      }
      newlineIndex = pendingText.indexOf('\n');
    }
  }

  const trailingText = decoder.decode();
  if (documentText !== null) {
    yield* emitOtlpTraceBatches(parseZipkinTraceJson(documentText + trailingText), batchSize);
    return;
  }
  pendingText += trailingText;
  if (pendingText.trim()) {
    yield* emitOtlpTraceBatches(
      parseZipkinTraceJson(pendingText, {resourceId, scopeId}),
      batchSize
    );
  }
}

/** Decodes one UTF-8 input buffer. */
function decodeBytes(chunk: ArrayBufferLike | ArrayBufferView): string {
  return new TextDecoder().decode(getBytes(chunk));
}

/** Returns one byte view without copying its input. */
function getBytes(chunk: ArrayBufferLike | ArrayBufferView): Uint8Array {
  return ArrayBuffer.isView(chunk)
    ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
    : new Uint8Array(chunk);
}
