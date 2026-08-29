// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Incubating Iceberg table-format adapters.
 *
 * This entry point is intentionally separate from the scan package root. The adapter remains
 * backed by the Parquet implementation while its public API and planning semantics mature.
 */
export {IcebergTableSource} from '@loaders.gl/parquet/iceberg-table-source';
export type {
  IcebergScanOptions,
  IcebergSourceOptions
} from '@loaders.gl/parquet/iceberg-table-source';
export {IcebergRestCatalog} from '@loaders.gl/parquet/iceberg-rest-catalog';
export type {
  IcebergRestCatalogOptions,
  IcebergRestTable,
  IcebergRestTableIdentifier
} from '@loaders.gl/parquet/iceberg-rest-catalog';
export type {
  IcebergBoundingBox,
  IcebergDataFile,
  IcebergDeleteFile,
  IcebergManifestFile,
  IcebergParquetFile,
  IcebergPartitionSpec,
  IcebergScanPlan,
  IcebergSchema,
  IcebergSnapshot,
  IcebergSnapshotReference,
  IcebergSpatialFilter,
  IcebergTableMetadata,
  IcebergTableSourceOptions
} from '@loaders.gl/parquet/iceberg-types';
