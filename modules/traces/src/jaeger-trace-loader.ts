// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';

import {
  JaegerTraceLoader as JaegerTraceLoaderMetadata,
  type JaegerTraceLoaderOptions
} from './jaeger-trace-loader-types';
import type {OtlpTrace, OtlpTraceBatch} from './otlp-trace-arrow-schema';
import {emitOtlpTraceBatches, normalizeOtlpBatchSize} from './otlp-trace-batches';
import {parseJaegerTraceJson} from './jaeger-trace-parser';

const {preload: _preload, ...JaegerTraceLoaderMetadataWithoutPreload} = JaegerTraceLoaderMetadata;

/** Parser-bearing loader for Jaeger JSON and JSON Lines traces. */
export const JaegerTraceLoaderWithParser = {
  ...JaegerTraceLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseJaegerTraceJson(decodeBytes(arrayBuffer)),
  parseSync: (arrayBuffer: ArrayBuffer) => parseJaegerTraceJson(decodeBytes(arrayBuffer)),
  parseText: async (text: string) => parseJaegerTraceJson(text),
  parseTextSync: (text: string) => parseJaegerTraceJson(text),
  parseInBatches: parseJaegerTraceInBatches
} as const satisfies LoaderWithParser<OtlpTrace, OtlpTraceBatch, JaegerTraceLoaderOptions>;

/** Parses chunked Jaeger JSON or JSON Lines into tagged Arrow batches. */
async function* parseJaegerTraceInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JaegerTraceLoaderOptions
): AsyncIterable<OtlpTraceBatch> {
  const decoder = new TextDecoder();
  const batchSize = normalizeOtlpBatchSize(options?.jaegerTrace?.batchSize);
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
          const trace = parseJaegerTraceJson(line, {resourceId, scopeId});
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
    yield* emitOtlpTraceBatches(parseJaegerTraceJson(documentText + trailingText), batchSize);
    return;
  }

  pendingText += trailingText;
  if (pendingText.trim()) {
    yield* emitOtlpTraceBatches(
      parseJaegerTraceJson(pendingText, {resourceId, scopeId}),
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
