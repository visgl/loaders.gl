// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Incubating Delta Lake table-format adapters.
 *
 * This entry point is intentionally separate from the scan package root. The adapter remains
 * backed by the Parquet implementation while its transaction-log and snapshot APIs mature.
 */
export {DeltaTableSource, DeltaSourceLoaderWithParser} from '@loaders.gl/parquet/delta-source';
export {DeltaSourceLoader} from '@loaders.gl/parquet/delta-source-loader-types';
export type {DeltaSourceLoaderOptions} from '@loaders.gl/parquet/delta-source-loader-types';
export type {
  DeltaAction,
  DeltaScanOptions,
  DeltaSourceOptions
} from '@loaders.gl/parquet/delta-types';
