// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataType, FieldMetadata, Schema} from '@loaders.gl/schema';
import type {ColumnarPredicate} from './columnar-predicate';
import type {
  TableQueryCapabilities,
  TableQueryOperatorSupport,
  TableQueryOptions
} from './table-query';

/** Semantic role used by query editors to choose appropriate controls for a column. */
export type ScanColumnRole =
  | 'attribute'
  | 'identifier'
  | 'geometry'
  | 'longitude'
  | 'latitude'
  | 'x'
  | 'y'
  | 'z'
  | 'time'
  | 'intensity'
  | 'classification'
  | 'color';

/** Schema information for one selectable or filterable scan column. */
export type ScanColumnMetadata = Readonly<{
  /** Stable source column name used by projections and predicates. */
  name: string;
  /** Portable loaders.gl data type. */
  type: DataType;
  /** Whether the source may produce null values for the column. */
  nullable: boolean;
  /** Semantic role used to select specialized query controls. */
  role: ScanColumnRole;
  /** Optional display title obtained from source field metadata. */
  title?: string;
  /** Optional human-readable description obtained from source field metadata. */
  description?: string;
  /** Original field metadata for source-specific UI extensions. */
  metadata: Readonly<FieldMetadata>;
}>;

/** Axis-aligned source bounds expressed in the source coordinate reference system. */
export type ScanBounds = Readonly<{
  /** Inclusive minimum coordinate for each available dimension. */
  minimum: readonly number[];
  /** Inclusive maximum coordinate for each available dimension. */
  maximum: readonly number[];
}>;

/** Spatial discovery information shared by vector, point-cloud, and raster query editors. */
export type ScanSpatialMetadata = Readonly<{
  /** Source bounds, when declared by format metadata. */
  bounds?: ScanBounds;
  /** Coordinate reference system identifiers or definitions advertised by the source. */
  coordinateReferenceSystems?: readonly string[];
}>;

/** One raster resolution level exposed to a scan query editor. */
export type ScanRasterLevel = Readonly<{
  /** Zero-based level index in the source pyramid. */
  index: number;
  /** Pixel width at this level. */
  width: number;
  /** Pixel height at this level. */
  height: number;
  /** Optional scale relative to the full-resolution level. */
  scale?: readonly [number, number];
}>;

/** Capabilities that a common scan-query panel can expose across source families. */
export type ScanQueryCapabilities = Readonly<{
  /** Relational projection, predicate, limit, streaming, and cancellation support. */
  table?: TableQueryCapabilities;
  /** Spatial bounds support when it is not already represented by a scalar predicate. */
  bounds?: TableQueryOperatorSupport;
  /** Hierarchy or resolution selection support for point clouds and multiscale rasters. */
  levelOfDetail?: TableQueryOperatorSupport;
}>;

/** Lightweight source statistics obtained without materializing result rows. */
export type ScanSourceStatistics = Readonly<{
  /** Exact or estimated source row/feature/point count. */
  rowCount?: number | bigint;
  /** Physical byte length when it is available from source metadata. */
  byteLength?: number | bigint;
}>;

/** Metadata used to populate a source-neutral query editor before executing a scan. */
export type ScanQueryMetadata = Readonly<{
  /** Stable adapter or format identifier. */
  sourceType: string;
  /** Query family used to enable table, point-cloud, or raster controls. */
  queryType: 'table' | 'point-cloud' | 'raster';
  /** Optional source display name. */
  name?: string;
  /** Optional source description. */
  description?: string;
  /** Complete query-visible schema, including geometry or coordinate columns. */
  schema: Schema;
  /** Query-visible columns in source order. */
  columns: readonly ScanColumnMetadata[];
  /** Portable and source-family-specific execution capabilities. */
  capabilities: ScanQueryCapabilities;
  /** Optional spatial metadata used to populate bounds controls. */
  spatial?: ScanSpatialMetadata;
  /** Optional statistics obtained from source metadata. */
  statistics?: ScanSourceStatistics;
  /** Optional multiscale raster levels. */
  levels?: readonly ScanRasterLevel[];
}>;

/** Options accepted by query metadata discovery methods. */
export type ScanQueryMetadataOptions = Readonly<{
  /** Cancels metadata discovery without starting a data scan. */
  signal?: AbortSignal;
}>;

/** Structural interface implemented by sources that support query-panel discovery. */
export type ScanQueryMetadataProvider = {
  /** Discovers query-visible columns and capabilities without materializing result rows. */
  getQueryMetadata(options?: ScanQueryMetadataOptions): Promise<ScanQueryMetadata>;
};

/**
 * Shared table-scan contract implemented by format-specific executors.
 *
 * The metadata method powers source-neutral query controls, while `read()` consumes the same
 * immutable table-query options and emits ordered batches. Format adapters may extend the options
 * and batch metadata with source-specific planning details.
 */
export type TableScanSource<
  BatchT = unknown,
  PredicateT extends ColumnarPredicate = ColumnarPredicate
> = ScanQueryMetadataProvider & {
  /** Reads the query result as ordered batches without changing the logical query semantics. */
  read(options?: TableQueryOptions<PredicateT>): AsyncIterable<BatchT>;
};

/** Inputs used to derive normalized query metadata from a loaders.gl schema. */
export type CreateScanQueryMetadataOptions = Readonly<{
  /** Stable adapter or format identifier. */
  sourceType: string;
  /** Query family used to enable specialized controls. */
  queryType: ScanQueryMetadata['queryType'];
  /** Complete query-visible schema. */
  schema: Schema;
  /** Portable and source-family-specific execution capabilities. */
  capabilities: ScanQueryCapabilities;
  /** Optional source display name. */
  name?: string;
  /** Optional source description. */
  description?: string;
  /** Optional semantic roles keyed by source column name. */
  columnRoles?: Readonly<Record<string, ScanColumnRole>>;
  /** Optional spatial metadata. */
  spatial?: ScanSpatialMetadata;
  /** Optional source statistics. */
  statistics?: ScanSourceStatistics;
  /** Optional multiscale raster levels. */
  levels?: readonly ScanRasterLevel[];
}>;

/**
 * Creates immutable query metadata and derives panel-ready columns from a loaders.gl schema.
 *
 * Source adapters only need to supply semantic roles that cannot be inferred from Arrow types.
 */
export function createScanQueryMetadata(
  options: CreateScanQueryMetadataOptions
): ScanQueryMetadata {
  const schema: Schema = Object.freeze({
    fields: Object.freeze(
      options.schema.fields.map(field =>
        Object.freeze({...field, metadata: Object.freeze({...field.metadata})})
      )
    ) as unknown as Schema['fields'],
    metadata: Object.freeze({...options.schema.metadata})
  });
  const columns = schema.fields.map(field =>
    Object.freeze({
      name: field.name,
      type: field.type,
      nullable: field.nullable !== false,
      role: options.columnRoles?.[field.name] || 'attribute',
      title: getNonEmptyMetadataValue(field.metadata, 'title'),
      description: getNonEmptyMetadataValue(field.metadata, 'description'),
      metadata: field.metadata || Object.freeze({})
    })
  );

  return Object.freeze({
    sourceType: options.sourceType,
    queryType: options.queryType,
    name: options.name,
    description: options.description,
    schema,
    columns: Object.freeze(columns),
    capabilities: Object.freeze({...options.capabilities}),
    spatial: options.spatial
      ? Object.freeze({
          ...options.spatial,
          bounds: options.spatial.bounds
            ? Object.freeze({
                minimum: Object.freeze([...options.spatial.bounds.minimum]),
                maximum: Object.freeze([...options.spatial.bounds.maximum])
              })
            : undefined,
          coordinateReferenceSystems: options.spatial.coordinateReferenceSystems
            ? Object.freeze([...options.spatial.coordinateReferenceSystems])
            : undefined
        })
      : undefined,
    statistics: options.statistics ? Object.freeze({...options.statistics}) : undefined,
    levels: options.levels
      ? Object.freeze(
          options.levels.map(level =>
            Object.freeze({
              ...level,
              scale: level.scale
                ? (Object.freeze([...level.scale]) as readonly [number, number])
                : undefined
            })
          )
        )
      : undefined
  });
}

function getNonEmptyMetadataValue(
  metadata: FieldMetadata | undefined,
  key: string
): string | undefined {
  const value = metadata?.[key];
  return value || undefined;
}
