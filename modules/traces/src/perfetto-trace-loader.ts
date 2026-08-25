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
import {streamProtobufMessages} from './perfetto-protobuf';
import {parsePerfettoTrace, PerfettoTraceParser} from './perfetto-trace-parser';

const {preload: _preload, ...PerfettoTraceLoaderMetadataWithoutPreload} =
  PerfettoTraceLoaderMetadata;

/** Parser-bearing loader for Perfetto protobuf traces. */
export const PerfettoTraceLoaderWithParser = {
  ...PerfettoTraceLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: PerfettoTraceLoaderOptions) =>
    parsePerfettoTrace(new Uint8Array(arrayBuffer), options?.perfettoTrace),
  parseSync: (arrayBuffer: ArrayBuffer, options?: PerfettoTraceLoaderOptions) =>
    parsePerfettoTrace(new Uint8Array(arrayBuffer), options?.perfettoTrace),
  parseInBatches: parsePerfettoTraceInBatches
} as const satisfies LoaderWithParser<
  PerfettoTrace,
  PerfettoTraceBatch,
  PerfettoTraceLoaderOptions
>;

/** Streams TracePackets and emits bounded tagged Arrow batches per logical table. */
async function* parsePerfettoTraceInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: PerfettoTraceLoaderOptions
): AsyncIterable<PerfettoTraceBatch> {
  const batchSize = normalizeBatchSize(options?.perfettoTrace?.batchSize);
  const parser = new PerfettoTraceParser(options?.perfettoTrace);
  let packetCount = 0;

  for await (const packet of streamProtobufMessages(iterator, 1)) {
    parser.addTracePacket(packet);
    packetCount++;
    if (packetCount >= batchSize) {
      yield* emitTraceBatches(parser.drain(), batchSize);
      packetCount = 0;
    }
  }
  yield* emitTraceBatches(parser.drain(), batchSize);
}

/** Emits all non-empty logical tables from one parser drain. */
function* emitTraceBatches(trace: PerfettoTrace, batchSize: number): Iterable<PerfettoTraceBatch> {
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
