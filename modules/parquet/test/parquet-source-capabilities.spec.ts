// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
import { PARQUET_SOURCE_CAPABILITIES, type ParquetSourceCapabilities } from '../src/parquet-source-capabilities';
test('ParquetSourceCapabilities#advertises implemented and deferred features', () => {
    const expectedCapabilities: ParquetSourceCapabilities = {
        tableQuery: {
            projection: 'pushdown',
            predicate: 'pushdown+residual',
            limit: 'pushdown',
            streaming: true,
            cancellation: true
        },
        supportsCachedMetadata: true,
        supportsRowGroupSelection: true,
        supportsColumnProjection: true,
        supportsBatchProvenance: true,
        supportsCooperativeReadCancellation: true,
        supportsLocalWasmAsset: true,
        supportsColumnStatistics: true,
        supportsPredicatePushdown: true,
        supportsPageIndexPruning: true,
        supportsGeoParquetSpatialPruning: true,
        supportsExactPredicateFiltering: true,
        supportsCustomRangeTransport: true,
        supportsObjectVersionValidation: true,
        supportsNetworkTelemetry: true,
        supportsDecodeTelemetry: true,
        supportsWorkerDecoding: true
    };
    expect(Object.isFrozen(PARQUET_SOURCE_CAPABILITIES), 'freezes the shared capability descriptor').toBeTruthy();
    expect(PARQUET_SOURCE_CAPABILITIES, 'distinguishes implemented source features from deferred backend features').toEqual(expectedCapabilities);
});
