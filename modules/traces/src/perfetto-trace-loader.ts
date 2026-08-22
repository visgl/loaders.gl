// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type * as arrow from 'apache-arrow';

import {
  PerfettoTraceLoader as PerfettoTraceLoaderMetadata,
  type PerfettoTraceLoaderOptions
} from './perfetto-trace-loader-types';
import type {
  PerfettoTrace,
  PerfettoTraceBatch,
  PerfettoTraceTableName
} from './perfetto-trace-arrow-schema';
import {parsePerfettoTrace} from './perfetto-trace-parser';

const {preload: _preload, ...PerfettoTraceLoaderMetadataWithoutPreload} =
  PerfettoTraceLoaderMetadata;

/** Parser-bearing loader for Perfetto protobuf traces. */
export const PerfettoTraceLoaderWithParser = {
  ...PerfettoTraceLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parsePerfettoTrace(new Uint8Array(arrayBuffer)),
  parseSync: (arrayBuffer: ArrayBuffer) => parsePerfettoTrace(new Uint8Array(arrayBuffer)),
  parseInBatches: parsePerfettoTraceInBatches
} as const satisfies LoaderWithParser<
  PerfettoTrace,
  PerfettoTraceBatch,
  PerfettoTraceLoaderOptions
>;

/** Collects a binary stream and emits bounded tagged Arrow batches per logical table. */
async function* parsePerfettoTraceInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: PerfettoTraceLoaderOptions
): AsyncIterable<PerfettoTraceBatch> {
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  for await (const chunk of iterator) {
    const bytes = ArrayBuffer.isView(chunk)
      ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
      : new Uint8Array(chunk);
    chunks.push(bytes);
    byteLength += bytes.byteLength;
  }

  const bytes = new Uint8Array(byteLength);
  let byteOffset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, byteOffset);
    byteOffset += chunk.byteLength;
  }

  const trace = parsePerfettoTrace(bytes);
  const batchSize = normalizeBatchSize(options?.perfettoTrace?.batchSize);
  yield* emitTableBatches('tracks', trace.tracks, batchSize);
  yield* emitTableBatches('slices', trace.slices, batchSize);
  yield* emitTableBatches('processes', trace.processes, batchSize);
  yield* emitTableBatches('threads', trace.threads, batchSize);
}

/** Emits bounded record batches from one logical Perfetto table. */
function* emitTableBatches(
  tableName: PerfettoTraceTableName,
  table: arrow.Table,
  batchSize: number
): Iterable<PerfettoTraceBatch> {
  for (let rowOffset = 0; rowOffset < table.numRows; rowOffset += batchSize) {
    for (const data of table.slice(rowOffset, rowOffset + batchSize).batches) {
      yield {table: tableName, data};
    }
  }
}

/** Normalizes the requested Perfetto Arrow batch size. */
function normalizeBatchSize(batchSize: number | undefined): number {
  return batchSize && Number.isFinite(batchSize) && batchSize > 0
    ? Math.max(1, Math.floor(batchSize))
    : 4096;
}
