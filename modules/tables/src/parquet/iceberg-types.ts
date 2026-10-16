// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Minimal Iceberg table metadata shape needed for read-only table discovery. */
export type IcebergTableMetadata = {
  /** Iceberg metadata format version. */
  readonly 'format-version': 1 | 2 | 3;
  /** Table UUID when supplied by the writer. */
  readonly 'table-uuid'?: string;
  /** Root location used to resolve manifest and data-file paths. */
  readonly location: string;
  /** Current snapshot identifier, or `-1` when the table has no snapshot. */
  readonly 'current-snapshot-id'?: number;
  /** Snapshot sequence number. */
  readonly 'last-sequence-number'?: number;
  /** Metadata update time in milliseconds since the Unix epoch. */
  readonly 'last-updated-ms'?: number;
  /** Current schema identifier. */
  readonly 'current-schema-id'?: number;
  /** Schemas declared by the table metadata. */
  readonly schemas?: readonly IcebergSchema[];
  /** Partition specifications declared by the table metadata. */
  readonly 'partition-specs'?: readonly IcebergPartitionSpec[];
  /** Default partition specification identifier. */
  readonly 'default-spec-id'?: number;
  /** Table snapshots. */
  readonly snapshots?: readonly IcebergSnapshot[];
  /** Named snapshot references such as `main`, branches, and tags. */
  readonly refs?: Readonly<Record<string, IcebergSnapshotReference>>;
  /** Table properties. */
  readonly properties?: Readonly<Record<string, string>>;
  /** Additional Iceberg metadata fields retained for forward compatibility. */
  readonly [key: string]: unknown;
};

/** Named Iceberg branch or tag reference. */
export type IcebergSnapshotReference = Readonly<Record<string, unknown>> & {
  readonly 'snapshot-id': number;
  readonly type?: 'branch' | 'tag' | string;
};

/** Iceberg schema metadata retained without imposing a schema-model dependency. */
export type IcebergSchema = Readonly<Record<string, unknown>> & {
  readonly 'schema-id'?: number;
  readonly fields?: readonly Readonly<Record<string, unknown>>[];
};

/** Iceberg partition specification metadata. */
export type IcebergPartitionSpec = Readonly<Record<string, unknown>> & {
  readonly 'spec-id'?: number;
  readonly fields?: readonly Readonly<Record<string, unknown>>[];
};

/** Iceberg snapshot metadata used to select a manifest list. */
export type IcebergSnapshot = Readonly<Record<string, unknown>> & {
  readonly 'snapshot-id': number;
  readonly 'sequence-number'?: number;
  readonly 'manifest-list'?: string;
  readonly 'schema-id'?: number;
  readonly summary?: Readonly<Record<string, string>>;
};

/** One data or delete manifest referenced by an Iceberg manifest list. */
export type IcebergManifestFile = Readonly<Record<string, unknown>> & {
  readonly manifest_path: string;
  readonly manifest_length?: number;
  readonly partition_spec_id?: number;
  readonly content?: number | string;
};

/** One data or delete file entry decoded from an Iceberg manifest. */
export type IcebergDataFile = Readonly<Record<string, unknown>> & {
  readonly file_path: string;
  readonly file_format: string;
  readonly file_size_in_bytes?: number;
  readonly record_count?: number;
  readonly partition?: Readonly<Record<string, unknown>>;
  readonly lower_bounds?: Readonly<Record<string, unknown>>;
  readonly upper_bounds?: Readonly<Record<string, unknown>>;
  readonly content?: number | string;
  readonly referenced_data_file?: string;
  readonly equality_ids?: readonly number[];
  readonly sort_order_id?: number;
  readonly data_sequence_number?: number;
};

/** Parquet data-file plan produced by the Iceberg manifest reader. */
export type IcebergParquetFile = {
  readonly data: string;
  readonly fileSize?: number;
  readonly recordCount?: number;
  readonly partition?: Readonly<Record<string, unknown>>;
  readonly lowerBounds?: Readonly<Record<string, unknown>>;
  readonly upperBounds?: Readonly<Record<string, unknown>>;
  /** Manifest path that contributed this file. */
  readonly manifestPath?: string;
  /** Partition specification identifier for this manifest. */
  readonly partitionSpecId?: number;
  /** Snapshot used to produce this plan. */
  readonly snapshotId?: number;
  /** Iceberg data sequence number when supplied by the manifest entry. */
  readonly dataSequenceNumber?: number;
  /** Schema identifier used by the snapshot that contributed this file. */
  readonly schemaId?: number;
};

/** Planned Iceberg delete file retained for optional delete application during a scan. */
export type IcebergDeleteFile = {
  /** URL or path of the delete file. */
  readonly data: string;
  /** Iceberg delete-file format, commonly `avro` or `puffin`. */
  readonly format: string;
  /** Delete content kind, such as position or equality deletes. */
  readonly content?: number | string;
  /** Referenced data file for a position delete file. */
  readonly referencedDataFile?: string;
  /** Field IDs used by an equality delete file. */
  readonly equalityFieldIds?: readonly number[];
  /** File size from the manifest. */
  readonly fileSize?: number;
  /** Record count from the manifest. */
  readonly recordCount?: number;
  /** Partition values from the manifest. */
  readonly partition?: Readonly<Record<string, unknown>>;
  /** Manifest path that contributed this delete file. */
  readonly manifestPath?: string;
  /** Partition specification identifier for this manifest. */
  readonly partitionSpecId?: number;
  /** Snapshot used to produce this plan. */
  readonly snapshotId?: number;
  /** Schema identifier used by the snapshot that contributed this delete file. */
  readonly schemaId?: number;
  /** Iceberg data sequence number associated with this delete file. */
  readonly dataSequenceNumber?: number;
};

/** Files selected from one Iceberg snapshot before delete application. */
export type IcebergScanPlan = {
  /** Active Parquet data files selected from data manifests. */
  readonly dataFiles: readonly IcebergParquetFile[];
  /** Delete files discovered from delete manifests. */
  readonly deleteFiles: readonly IcebergDeleteFile[];
  /** Snapshot identifier used to build the plan. */
  readonly snapshotId?: number;
  /** Named snapshot reference used to build this plan, when supplied. */
  readonly snapshotRef?: string;
};

/** Axis-aligned geographic bounds in `[minX, minY, maxX, maxY]` order. */
export type IcebergBoundingBox = readonly [number, number, number, number];

/** Conservative spatial filter used for Iceberg file-level pruning. */
export type IcebergSpatialFilter = {
  /** Top-level geometry column or Iceberg field name whose bounds are being queried. */
  readonly column: string;
  /** Query envelope in `[minX, minY, maxX, maxY]` order. */
  readonly bbox: IcebergBoundingBox;
};

/** Options for constructing a read-only Iceberg table source. */
export type IcebergTableSourceOptions = {
  /** HTTP headers forwarded to metadata requests. */
  readonly headers?: HeadersInit;
};
