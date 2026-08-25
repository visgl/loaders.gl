// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';

import {
  OtlpTraceJsonLoader as OtlpTraceJsonLoaderMetadata,
  type OtlpTraceLoaderOptions
} from './otlp-trace-loader-types';
import type {OtlpTrace, OtlpTraceBatch} from './otlp-trace-arrow-schema';
import {emitOtlpTraceBatches, normalizeOtlpBatchSize} from './otlp-trace-batches';
import {parseOtlpTraceJson} from './otlp-trace-parser';

const {preload: _preload, ...OtlpTraceJsonLoaderMetadataWithoutPreload} =
  OtlpTraceJsonLoaderMetadata;

/** Parser-bearing loader for OTLP protobuf-JSON and JSON Lines traces. */
export const OtlpTraceJsonLoaderWithParser = {
  ...OtlpTraceJsonLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseOtlpTraceJson(decodeBytes(arrayBuffer)),
  parseSync: (arrayBuffer: ArrayBuffer) => parseOtlpTraceJson(decodeBytes(arrayBuffer)),
  parseText: async (text: string) => parseOtlpTraceJson(text),
  parseTextSync: (text: string) => parseOtlpTraceJson(text),
  parseInBatches: parseOtlpTraceJsonInBatches
} as const satisfies LoaderWithParser<OtlpTrace, OtlpTraceBatch, OtlpTraceLoaderOptions>;

/** Parses a chunked OTLP JSON or JSON Lines stream into Arrow batches. */
async function* parseOtlpTraceJsonInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: OtlpTraceLoaderOptions
): AsyncIterable<OtlpTraceBatch> {
  const decoder = new TextDecoder();
  const batchSize = normalizeOtlpBatchSize(options?.otlpTrace?.batchSize);
  let pendingText = '';
  let documentText: string | null = null;
  let parsedLineCount = 0;
  let resourceId = 0;
  let scopeId = 0;

  for await (const chunk of iterator) {
    const bytes = getBytes(chunk);
    const decodedText = decoder.decode(bytes, {stream: true});
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
          const trace = parseOtlpTraceJson(line, {resourceId, scopeId});
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
    yield* emitOtlpTraceBatches(parseOtlpTraceJson(documentText + trailingText), batchSize);
    return;
  }

  pendingText += trailingText;
  if (pendingText.trim()) {
    const trace = parseOtlpTraceJson(pendingText, {resourceId, scopeId});
    yield* emitOtlpTraceBatches(trace, batchSize);
  }
}

/** Decodes one UTF-8 stream chunk. */
function decodeBytes(chunk: ArrayBufferLike | ArrayBufferView): string {
  return new TextDecoder().decode(getBytes(chunk));
}

/** Returns one byte view without copying its underlying stream chunk. */
function getBytes(chunk: ArrayBufferLike | ArrayBufferView): Uint8Array {
  return ArrayBuffer.isView(chunk)
    ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
    : new Uint8Array(chunk);
}
