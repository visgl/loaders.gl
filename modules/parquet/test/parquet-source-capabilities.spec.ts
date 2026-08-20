// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';

import {
  PARQUET_SOURCE_CAPABILITIES,
  type ParquetSourceCapabilities
} from '../src/parquet-source-capabilities';

test('ParquetSourceCapabilities#advertises implemented and deferred features', t => {
  const expectedCapabilities: ParquetSourceCapabilities = {
    supportsCachedMetadata: true,
    supportsRowGroupSelection: true,
    supportsColumnProjection: true,
    supportsBatchProvenance: true,
    supportsCooperativeReadCancellation: true,
    supportsLocalWasmAsset: true,
    supportsColumnStatistics: true,
    supportsPredicatePushdown: true,
    supportsExactPredicateFiltering: true,
    supportsCustomRangeTransport: true,
    supportsObjectVersionValidation: true,
    supportsNetworkTelemetry: true,
    supportsDecodeTelemetry: true,
    supportsWorkerDecoding: true
  };

  t.ok(Object.isFrozen(PARQUET_SOURCE_CAPABILITIES), 'freezes the shared capability descriptor');
  t.deepEqual(
    PARQUET_SOURCE_CAPABILITIES,
    expectedCapabilities,
    'distinguishes implemented source features from deferred backend features'
  );
  t.end();
});
