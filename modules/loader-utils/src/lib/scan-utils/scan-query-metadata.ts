// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataType, FieldMetadata, Schema} from '@loaders.gl/schema';
import type {ColumnarPredicate, ColumnarPredicateProperty} from './columnar-predicate';
import type {
  TableQueryCapabilities,
  TableQueryOperatorSupport,
  TableQueryOptions
} from './table-query';
import type {PointCloudQueryOptions} from './point-cloud-query';
import type {RasterQueryCapabilities} from './raster-query';
import type {TableQueryExplain} from './table-query-explain';

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
  /** Raster variable, slice, window, streaming, and cancellation support. */
  raster?: RasterQueryCapabilities;
}>;

/** Lightweight source statistics obtained without materializing result rows. */
export type ScanSourceStatistics = Readonly<{
  /** Exact or estimated source row/feature/point count. */
  rowCount?: number | bigint;
  /** Physical byte length when it is available from source metadata. */
  byteLength?: number | bigint;
}>;

/** Common source method that executes the query described by scan metadata. */
export type ScanExecutionMethod = 'read' | 'query' | 'getRaster' | 'scan';

/**
 * Conclusive execution status advertised by a scan-aware source.
 *
 * `supported` identifies the common method applications can call today. `metadata-only` means the
 * source can populate discovery UI but deliberately does not claim common scan execution.
 */
export type ScanExecutionSupport =
  | Readonly<{
      /** The source executes common scan requests. */
      status: 'supported';
      /** Public source method that executes the request. */
      method: ScanExecutionMethod;
    }>
  | Readonly<{
      /** The source only supports query metadata discovery. */
      status: 'metadata-only';
      /** Concrete missing execution capability shown to users and documentation tooling. */
      reason: string;
    }>;

/** Metadata used to populate a source-neutral query editor before executing a scan. */
export type ScanQueryMetadata = Readonly<{
  /** Stable adapter or format identifier. */
  sourceType: string;
  /** Query family used to enable table, point-cloud, or raster controls. */
  queryType: 'table' | 'point-cloud' | 'raster';
  /** Conclusive common execution status and entry point. */
  execution: ScanExecutionSupport;
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

/** Terminal state of one observable scan execution. */
export type ScanExecutionTelemetryStatus =
  | 'completed'
  | 'early-terminated'
  | 'cancelled'
  | 'failed';

/** Portable execution counters for one physical source in a federated scan. */
export type ScanSourceExecutionTelemetry = Readonly<{
  /** Stable registry id when the source was resolved through a DataSourceManager. */
  sourceId?: string;
  /** Format or adapter type reported by scan metadata. */
  sourceType: string;
  /** Zero-based append position for a federated source. */
  sourceIndex?: number;
  /** Terminal state of this physical source iterator. */
  status: ScanExecutionTelemetryStatus;
  /** Physical files opened by this source, when measurable. */
  filesOpened?: number;
  /** Independently scheduled physical tasks opened by this source, when measurable. */
  tasksOpened?: number;
  /** Response bytes fetched from storage, excluding cache hits, when measurable. */
  bytesFetched?: number;
  /** Physical batches decoded before common residual execution. */
  batchesDecoded: number;
  /** Rows decoded or received from the physical source. */
  rowsRead: number;
  /** Rows evaluated by exact predicates in this source. */
  rowsTested?: number;
  /** Rows retained by exact predicates in this source. */
  rowsRetained?: number;
  /** Rows emitted by this source to its parent executor. */
  rowsReturned: number;
  /** Rows or row groups eliminated using metadata before decoding. */
  rowsPruned?: number;
  /** Wall-clock time spent consuming this source. */
  durationMilliseconds: number;
  /** Source-specific immutable counters retained for detailed diagnostics. */
  details?: Readonly<Record<string, unknown>>;
  /** Failure or cancellation reason when one terminated this source. */
  error?: unknown;
}>;

/** Portable execution counters reported when a table scan terminates. */
export type ScanExecutionTelemetry = Readonly<{
  /** Terminal state distinguishing completion, early return, cancellation, and failure. */
  status: ScanExecutionTelemetryStatus;
  /** Number of physical sources included in the resolved plan. */
  sourcesPlanned: number;
  /** Number of physical source iterators that were opened. */
  sourcesRead: number;
  /** Number of physical data batches received from those sources. */
  batchesRead: number;
  /** Compatibility-neutral name for physical batches decoded by this execution. */
  batchesDecoded?: number;
  /** Number of rows received before residual filtering and the global limit. */
  rowsRead: number;
  /** Number of rows evaluated by the executor's residual predicate. */
  rowsTested?: number;
  /** Number of rows retained by the executor's residual predicate. */
  rowsRetained?: number;
  /** Number of rows emitted to the scan consumer. */
  rowsReturned: number;
  /** Physical bytes read when the source can measure them without estimation. */
  bytesRead?: number;
  /** Response bytes fetched from storage, excluding cache hits, when measurable. */
  bytesFetched?: number;
  /** Physical files opened by this execution, when measurable. */
  filesOpened?: number;
  /** Independently scheduled physical tasks opened by this execution, when measurable. */
  tasksOpened?: number;
  /** Rows or row groups eliminated using metadata before decoding. */
  rowsPruned?: number;
  /** Wall-clock execution time measured by the reporting source. */
  durationMilliseconds: number;
  /** Why a successfully shortened execution stopped before exhausting its plan. */
  earlyTerminationReason?: 'limit' | 'consumer-return';
  /** Per-source physical counters in deterministic append order. */
  sources?: readonly ScanSourceExecutionTelemetry[];
  /** Source-specific immutable counters retained for detailed diagnostics. */
  details?: Readonly<Record<string, unknown>>;
  /** Failure or cancellation reason when one terminated the scan. */
  error?: unknown;
}>;

/** Receives the immutable final counters for one table scan execution. */
export type ScanExecutionTelemetryCallback = (telemetry: ScanExecutionTelemetry) => void;

/** Structural interface implemented by sources that support query-panel discovery. */
export type ScanQueryMetadataProvider = {
  /** Discovers query-visible columns and capabilities without materializing result rows. */
  getQueryMetadata(options?: ScanQueryMetadataOptions): Promise<ScanQueryMetadata>;
};

/** Query options supplied to a table-scan executor, including cooperative cancellation. */
export type TableScanReadOptions<
  PredicateT extends ColumnarPredicate<unknown, ColumnarPredicateProperty> = ColumnarPredicate<
    unknown,
    ColumnarPredicateProperty
  >
> = TableQueryOptions<PredicateT> &
  Readonly<{
    /** Cooperatively cancels source discovery and execution. */
    signal?: AbortSignal;
    /** Receives one terminal execution snapshot without changing query semantics. */
    onTelemetry?: ScanExecutionTelemetryCallback;
  }>;

/**
 * Shared table-scan contract implemented by format-specific executors.
 *
 * The metadata method powers source-neutral query controls, while `read()` consumes the same
 * immutable table-query options and emits ordered batches. Format adapters may extend the options
 * and batch metadata with source-specific planning details.
 */
export type TableScanSource<
  BatchT = unknown,
  PredicateT extends ColumnarPredicate<unknown, ColumnarPredicateProperty> = ColumnarPredicate<
    unknown,
    ColumnarPredicateProperty
  >
> = ScanQueryMetadataProvider & {
  /** Explains the logical plan and physical support without decoding result rows. */
  explain?(options?: TableScanReadOptions<PredicateT>): Promise<TableQueryExplain<PredicateT>>;
  /** Reads the query result as ordered batches without changing the logical query semantics. */
  read(options?: TableScanReadOptions<PredicateT>): AsyncIterable<BatchT>;
};

/** Point-cloud scan options with a bound on each emitted Arrow batch. */
export type PointCloudScanReadOptions = PointCloudQueryOptions &
  Readonly<{
    /** Maximum number of retained points in each emitted batch. */
    batchSize?: number;
  }>;

/** Shared point-cloud scan contract implemented by hierarchy-backed sources. */
export type PointCloudScanSource<BatchT = unknown> = ScanQueryMetadataProvider & {
  /** Reads selected hierarchy nodes as ordered, globally limited point batches. */
  scan(options?: PointCloudScanReadOptions): AsyncIterable<BatchT>;
};

/** Inputs used to derive normalized query metadata from a loaders.gl schema. */
export type CreateScanQueryMetadataOptions = Readonly<{
  /** Stable adapter or format identifier. */
  sourceType: string;
  /** Query family used to enable specialized controls. */
  queryType: ScanQueryMetadata['queryType'];
  /** Conclusive common execution status and entry point. */
  execution: ScanExecutionSupport;
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
  validateScanExecutionSupport(options.queryType, options.execution);
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
    execution: Object.freeze({...options.execution}),
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

/** Ensures supported metadata names an entry point appropriate for its query family. */
function validateScanExecutionSupport(
  queryType: ScanQueryMetadata['queryType'],
  execution: ScanExecutionSupport
): void {
  if (execution.status === 'metadata-only') {
    if (!execution.reason.trim()) {
      throw new Error('Metadata-only scan support requires a concrete reason');
    }
    return;
  }

  const validMethods: Record<ScanQueryMetadata['queryType'], readonly ScanExecutionMethod[]> = {
    table: ['read', 'query'],
    raster: ['getRaster'],
    'point-cloud': ['scan']
  };
  if (!validMethods[queryType].includes(execution.method)) {
    throw new Error(
      `Scan execution method "${execution.method}" is not valid for ${queryType} queries`
    );
  }
}

function getNonEmptyMetadataValue(
  metadata: FieldMetadata | undefined,
  key: string
): string | undefined {
  const value = metadata?.[key];
  return value || undefined;
}
