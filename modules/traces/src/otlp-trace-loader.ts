// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fromBinary} from '@bufbuild/protobuf';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';

import {
  OtlpTraceLoader as OtlpTraceLoaderMetadata,
  type OtlpTraceLoaderOptions
} from './otlp-trace-loader-types';
import {ResourceSpansSchema} from './otlp-proto/generated/opentelemetry/proto/trace/v1/trace_pb';
import type {OtlpTrace, OtlpTraceBatch} from './otlp-trace-arrow-schema';
import {emitOtlpTraceBatches, normalizeOtlpBatchSize} from './otlp-trace-batches';
import {buildOtlpTrace, parseOtlpTraceProtobuf} from './otlp-trace-parser';
import {streamProtobufMessages} from './perfetto-protobuf';

const {preload: _preload, ...OtlpTraceLoaderMetadataWithoutPreload} = OtlpTraceLoaderMetadata;

/** Parser-bearing loader for OTLP protobuf traces. */
export const OtlpTraceLoaderWithParser = {
  ...OtlpTraceLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseOtlpTraceProtobuf(new Uint8Array(arrayBuffer)),
  parseSync: (arrayBuffer: ArrayBuffer) => parseOtlpTraceProtobuf(new Uint8Array(arrayBuffer)),
  parseInBatches: parseOtlpTraceInBatches
} as const satisfies LoaderWithParser<OtlpTrace, OtlpTraceBatch, OtlpTraceLoaderOptions>;

/** Streams ResourceSpans messages into tagged Arrow record batches. */
async function* parseOtlpTraceInBatches(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: OtlpTraceLoaderOptions
): AsyncIterable<OtlpTraceBatch> {
  const batchSize = normalizeOtlpBatchSize(options?.otlpTrace?.batchSize);
  let resourceId = 0;
  let scopeId = 0;
  for await (const bytes of streamProtobufMessages(iterator, 1)) {
    const resourceSpans = fromBinary(ResourceSpansSchema, bytes);
    const trace = buildOtlpTrace({resourceSpans: [resourceSpans]}, {resourceId, scopeId});
    resourceId += trace.resources.numRows;
    scopeId += trace.scopes.numRows;
    yield* emitOtlpTraceBatches(trace, batchSize);
  }
}
