// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  createScanQueryMetadata,
  explainTableQuery,
  planTableQuery,
  type DataSourceManager,
  type ManageableDataSource,
  type ScanQueryMetadata,
  type ScanQueryMetadataOptions,
  type TableQueryCapabilities,
  type TableQueryExplain,
  type TableScanReadOptions,
  type TableScanSource
} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  DataType,
  Field,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import {convertArrowToSchema, convertBatch, convertSchemaToArrow} from '@loaders.gl/schema-utils';
import {queryArrowTable, type SQLPredicate} from '@loaders.gl/sql';

/** Schema reconciliation modes supported by ordered append federation. */
export type FederatedTableSchemaPolicy = 'strict' | 'union';

/** One named table source participating in an ordered federated append. */
export type FederatedTableSourceEntry = Readonly<{
  /** Stable id resolved through the shared {@link DataSourceManager}. */
  dataSourceId: string;
  /** Source-local predicate, projection, and limit applied before schema reconciliation. */
  query?: Omit<TableScanReadOptions<SQLPredicate>, 'signal'>;
  /** Source-column to federated-column renames applied before compatibility checks. */
  columnMapping?: Readonly<Record<string, string>>;
}>;

/** Options for an ordered federated table source. */
export type FederatedTableScanSourceOptions = Readonly<{
  /** Named sources appended in caller-specified order. */
  sources: readonly FederatedTableSourceEntry[];
  /** Strict requires matching columns; union null-fills missing columns. Defaults to strict. */
  schemaPolicy?: FederatedTableSchemaPolicy;
  /** Optional display name reported through scan metadata. */
  name?: string;
  /** Optional description reported through scan metadata. */
  description?: string;
}>;

/** Provenance attached to every federated Arrow batch. */
export type FederatedTableBatchProvenance = Readonly<{
  /** Manager id of the source that emitted this batch. */
  sourceId: string;
  /** Zero-based source position in append order. */
  sourceIndex: number;
  /** Zero-based data-batch position within the source. */
  sourceBatchIndex: number;
  /** Original batch metadata supplied by the physical source. */
  sourceMetadata?: unknown;
}>;

/** Arrow batch emitted by an ordered federated scan. */
export type FederatedTableBatch = ArrowTableBatch<FederatedTableBatchProvenance> &
  Readonly<{
    /** Manager id of the source that emitted this batch. */
    sourceId: string;
    /** Zero-based source position in append order. */
    sourceIndex: number;
    /** Zero-based data-batch position within the source. */
    sourceBatchIndex: number;
  }>;

/** Per-source diagnostics included in a federated explanation. */
export type FederatedTableSourceExplain = Readonly<{
  /** Manager id resolved for this source. */
  sourceId: string;
  /** Zero-based source position in append order. */
  sourceIndex: number;
  /** Physical source type reported by metadata discovery. */
  sourceType: string;
  /** Source columns visible after the source-local projection. */
  sourceColumns: readonly string[];
  /** Federated column names produced after explicit mappings. */
  outputColumns: readonly string[];
  /** Explicit source-column to federated-column mappings. */
  columnMapping: Readonly<Record<string, string>>;
}>;

/** Serializable logical explanation for an ordered federated table scan. */
export type FederatedTableScanExplain = TableQueryExplain<SQLPredicate> &
  Readonly<{
    /** Schema policy used to reconcile child sources. */
    schemaPolicy: FederatedTableSchemaPolicy;
    /** Sources in physical append order. */
    sources: readonly FederatedTableSourceExplain[];
  }>;

/** Correctness capabilities of the federated append executor. */
export const FEDERATED_TABLE_QUERY_CAPABILITIES: TableQueryCapabilities = Object.freeze({
  predicate: 'residual',
  projection: 'pushdown+residual',
  limit: 'pushdown+residual',
  streaming: true,
  cancellation: true
});

type ManagedTableScanSource = ManageableDataSource & TableScanSource<TableBatch, SQLPredicate>;

type MappedSourceField = Readonly<{
  sourceName: string;
  outputName: string;
  field: Field;
}>;

type ResolvedFederatedSource = Readonly<{
  entry: FederatedTableSourceEntry;
  source: ManagedTableScanSource;
  metadata: ScanQueryMetadata;
  sourceIndex: number;
  fields: readonly MappedSourceField[];
  sourceNameByOutputName: ReadonlyMap<string, string>;
}>;

type FederatedTablePlan = Readonly<{
  schema: Schema;
  sources: readonly ResolvedFederatedSource[];
}>;

let nextFederatedSourceId = 0;

/**
 * Resolves managed table sources and appends their results as one ordered Arrow stream.
 *
 * `DataSourceManager` remains the single registry and lifecycle owner. This adapter subscribes for
 * the duration of metadata discovery or iteration, so deferred and non-persistent sources use the
 * same replacement, retention, and cleanup system as the rest of loaders.gl.
 */
export class FederatedTableScanSource
  implements TableScanSource<FederatedTableBatch, SQLPredicate>
{
  /** Shared manager used as the authoritative named-source registry. */
  readonly dataSourceManager: DataSourceManager;
  /** Immutable sources in physical append order. */
  readonly sources: readonly FederatedTableSourceEntry[];
  /** Schema reconciliation policy. */
  readonly schemaPolicy: FederatedTableSchemaPolicy;
  /** Optional display name reported through scan metadata. */
  readonly name?: string;
  /** Human-readable description reported through scan metadata. */
  readonly description: string;

  private readonly instanceId = nextFederatedSourceId++;
  private nextOperationId = 0;

  /** Creates an ordered federated source backed by one shared DataSourceManager. */
  constructor(dataSourceManager: DataSourceManager, options: FederatedTableScanSourceOptions) {
    if (!options.sources.length) {
      throw new Error('Federated table scans require at least one source.');
    }
    if (
      options.schemaPolicy &&
      options.schemaPolicy !== 'strict' &&
      options.schemaPolicy !== 'union'
    ) {
      throw new Error(`Unsupported federated schema policy: ${options.schemaPolicy}`);
    }
    this.dataSourceManager = dataSourceManager;
    this.sources = Object.freeze(options.sources.map(cloneSourceEntry));
    this.schemaPolicy = options.schemaPolicy || 'strict';
    this.name = options.name;
    this.description = options.description || `${this.sources.length} ordered table sources`;
  }

  /** Discovers and reconciles every child schema without reading federated result batches. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    const consumerId = this.createConsumerId('metadata');
    try {
      const plan = await this.resolvePlan(consumerId, options.signal);
      return createScanQueryMetadata({
        sourceType: 'federated-table',
        queryType: 'table',
        execution: {status: 'supported', method: 'read'},
        name: this.name,
        description: this.description,
        schema: plan.schema,
        capabilities: {table: FEDERATED_TABLE_QUERY_CAPABILITIES},
        statistics: getFederatedStatistics(plan.sources)
      });
    } finally {
      this.dataSourceManager.unsubscribe({consumerId});
    }
  }

  /** Explains source resolution, schema reconciliation, and the global table query. */
  async explain(
    options: TableScanReadOptions<SQLPredicate> = {}
  ): Promise<FederatedTableScanExplain> {
    const consumerId = this.createConsumerId('explain');
    try {
      const plan = await this.resolvePlan(consumerId, options.signal);
      const explanation = explainTableQuery(
        plan.schema.fields.map(field => field.name),
        options,
        FEDERATED_TABLE_QUERY_CAPABILITIES
      );
      return Object.freeze({
        ...explanation,
        schemaPolicy: this.schemaPolicy,
        sources: Object.freeze(plan.sources.map(createSourceExplanation))
      });
    } finally {
      this.dataSourceManager.unsubscribe({consumerId});
    }
  }

  /**
   * Emits source and batch ordered Arrow results with one global limit and batch provenance.
   *
   * Returning early from the iterator closes the active child iterator and releases every manager
   * subscription. Later sources are never read once the global limit has been satisfied.
   */
  async *read(
    options: TableScanReadOptions<SQLPredicate> = {}
  ): AsyncIterableIterator<FederatedTableBatch> {
    const consumerId = this.createConsumerId('read');
    try {
      const plan = await this.resolvePlan(consumerId, options.signal);
      const scanStep = planTableQuery(
        plan.schema.fields.map(field => field.name),
        options
      )[0] as Readonly<{columns: readonly string[]}>;
      let remaining = options.limit ?? Number.POSITIVE_INFINITY;
      if (remaining <= 0) return;

      for (const resolvedSource of plan.sources) {
        throwIfAborted(options.signal);
        if (remaining <= 0) return;
        const sourceReadOptions = createSourceReadOptions(
          resolvedSource,
          scanStep.columns,
          remaining,
          options
        );
        let sourceBatchIndex = 0;
        for await (const batch of resolvedSource.source.read(sourceReadOptions)) {
          throwIfAborted(options.signal);
          if (remaining <= 0) return;
          if (batch.batchType !== 'data' || batch.length <= 0) continue;
          const canonicalTable = createCanonicalArrowTable(plan.schema, resolvedSource, batch);
          const result = queryArrowTable(canonicalTable, {
            predicate: options.predicate,
            columns: options.columns,
            limit: Number.isFinite(remaining) ? remaining : undefined,
            signal: options.signal
          });
          const resultLength = result.data.numRows;
          const currentSourceBatchIndex = sourceBatchIndex++;
          if (!resultLength) continue;
          const provenance: FederatedTableBatchProvenance = Object.freeze({
            sourceId: resolvedSource.entry.dataSourceId,
            sourceIndex: resolvedSource.sourceIndex,
            sourceBatchIndex: currentSourceBatchIndex,
            sourceMetadata: batch.metadata
          });
          yield {
            batchType: 'data',
            shape: 'arrow-table',
            schema: convertArrowToSchema(result.data.schema),
            data: result.data,
            length: resultLength,
            metadata: provenance,
            sourceId: provenance.sourceId,
            sourceIndex: provenance.sourceIndex,
            sourceBatchIndex: provenance.sourceBatchIndex
          };
          remaining -= resultLength;
        }
      }
    } finally {
      this.dataSourceManager.unsubscribe({consumerId});
    }
  }

  /** Resolves managed sources, discovers their schemas, and creates one compatibility plan. */
  private async resolvePlan(consumerId: string, signal?: AbortSignal): Promise<FederatedTablePlan> {
    const sources: ResolvedFederatedSource[] = [];
    for (let sourceIndex = 0; sourceIndex < this.sources.length; sourceIndex++) {
      throwIfAborted(signal);
      const entry = this.sources[sourceIndex];
      const source = await resolveManagedSource(
        this.dataSourceManager,
        entry.dataSourceId,
        consumerId,
        String(sourceIndex),
        signal
      );
      if (typeof source.getQueryMetadata !== 'function' || typeof source.read !== 'function') {
        throw new Error(`Managed source does not implement TableScanSource: ${entry.dataSourceId}`);
      }
      const metadata = await source.getQueryMetadata({signal});
      if (metadata.execution.status !== 'supported' || metadata.execution.method !== 'read') {
        throw new Error(`Federated table source does not support read(): ${entry.dataSourceId}`);
      }
      if (metadata.queryType !== 'table') {
        throw new Error(`Federated source is not a table source: ${entry.dataSourceId}`);
      }
      const fields = resolveMappedFields(entry, metadata);
      sources.push({
        entry,
        source,
        metadata,
        sourceIndex,
        fields,
        sourceNameByOutputName: new Map(fields.map(field => [field.outputName, field.sourceName]))
      });
    }
    return Object.freeze({
      schema: reconcileSchemas(sources, this.schemaPolicy),
      sources: Object.freeze(sources)
    });
  }

  /** Returns a collision-free manager consumer id for one operation. */
  private createConsumerId(operation: string): string {
    return `federated-table:${this.instanceId}:${operation}:${this.nextOperationId++}`;
  }
}

/** Clones the public entry so later caller mutations cannot change a running plan. */
function cloneSourceEntry(entry: FederatedTableSourceEntry): FederatedTableSourceEntry {
  if (!entry.dataSourceId) {
    throw new Error('Federated table source ids must be non-empty.');
  }
  return Object.freeze({
    dataSourceId: entry.dataSourceId,
    query: entry.query
      ? Object.freeze({
          ...entry.query,
          columns: entry.query.columns ? Object.freeze([...entry.query.columns]) : undefined
        })
      : undefined,
    columnMapping: entry.columnMapping ? Object.freeze({...entry.columnMapping}) : undefined
  });
}

/** Selects source-local fields and applies explicit output names. */
function resolveMappedFields(
  entry: FederatedTableSourceEntry,
  metadata: ScanQueryMetadata
): readonly MappedSourceField[] {
  const sourceFields = new Map(metadata.schema.fields.map(field => [field.name, field]));
  for (const sourceName of Object.keys(entry.columnMapping || {})) {
    if (!sourceFields.has(sourceName)) {
      throw new Error(
        `Federated column mapping source not found in ${entry.dataSourceId}: ${sourceName}`
      );
    }
  }
  const selectedNames = entry.query?.columns || metadata.schema.fields.map(field => field.name);
  if (!selectedNames.length) {
    throw new Error(`Federated source projection must not be empty: ${entry.dataSourceId}`);
  }
  const outputNames = new Set<string>();
  return Object.freeze(
    selectedNames.map(sourceName => {
      const field = sourceFields.get(sourceName);
      if (!field) {
        throw new Error(
          `Federated source column not found in ${entry.dataSourceId}: ${sourceName}`
        );
      }
      const outputName = entry.columnMapping?.[sourceName] ?? sourceName;
      if (!outputName) {
        throw new Error(`Federated output column names must be non-empty: ${sourceName}`);
      }
      if (outputNames.has(outputName)) {
        throw new Error(
          `Federated column mapping creates duplicate output column in ${entry.dataSourceId}: ${outputName}`
        );
      }
      outputNames.add(outputName);
      return Object.freeze({sourceName, outputName, field});
    })
  );
}

/** Reconciles mapped fields using strict equality or first-seen union ordering. */
function reconcileSchemas(
  sources: readonly ResolvedFederatedSource[],
  schemaPolicy: FederatedTableSchemaPolicy
): Schema {
  const outputFields = new Map<string, Field & {presentCount: number}>();
  const firstSourceNames = sources[0].fields.map(field => field.outputName);
  for (const source of sources) {
    const sourceNames = new Set(source.fields.map(field => field.outputName));
    if (schemaPolicy === 'strict') {
      const missing = firstSourceNames.filter(name => !sourceNames.has(name));
      const extra = source.fields
        .map(field => field.outputName)
        .filter(name => !firstSourceNames.includes(name));
      if (missing.length || extra.length) {
        throw new Error(
          `Federated strict schema mismatch for ${source.entry.dataSourceId}: missing [${missing.join(', ')}], extra [${extra.join(', ')}]`
        );
      }
    }
    for (const mappedField of source.fields) {
      const current = outputFields.get(mappedField.outputName);
      if (current) {
        if (!areDataTypesEqual(current.type, mappedField.field.type)) {
          throw new Error(
            `Federated column type mismatch for ${mappedField.outputName}: ${formatDataType(current.type)} versus ${formatDataType(mappedField.field.type)} in ${source.entry.dataSourceId}`
          );
        }
        current.nullable = Boolean(current.nullable || mappedField.field.nullable);
        current.presentCount++;
      } else {
        outputFields.set(mappedField.outputName, {
          ...mappedField.field,
          name: mappedField.outputName,
          metadata: mappedField.field.metadata ? {...mappedField.field.metadata} : undefined,
          presentCount: 1
        });
      }
    }
  }
  const fields = [...outputFields.values()].map(({presentCount, ...field}) => ({
    ...field,
    nullable: Boolean(field.nullable || presentCount < sources.length)
  }));
  return {fields, metadata: {}};
}

/** Creates the source-local query required by the global canonical scan step. */
function createSourceReadOptions(
  source: ResolvedFederatedSource,
  requiredOutputColumns: readonly string[],
  remaining: number,
  options: TableScanReadOptions<SQLPredicate>
): TableScanReadOptions<SQLPredicate> {
  const requiredSourceColumns = requiredOutputColumns
    .map(outputName => source.sourceNameByOutputName.get(outputName))
    .filter((sourceName): sourceName is string => Boolean(sourceName));
  if (!requiredSourceColumns.length) {
    requiredSourceColumns.push(source.fields[0].sourceName);
  }
  const sourceLimit = source.entry.query?.limit;
  const globalLimitCanBePushed = options.predicate === undefined && Number.isFinite(remaining);
  const limit = globalLimitCanBePushed
    ? Math.min(sourceLimit ?? Number.POSITIVE_INFINITY, remaining)
    : sourceLimit;
  return {
    ...source.entry.query,
    columns: Object.freeze([...new Set(requiredSourceColumns)]),
    limit: Number.isFinite(limit) ? limit : undefined,
    signal: options.signal
  };
}

/** Converts one physical batch to the reconciled Arrow schema, renaming and null-filling fields. */
function createCanonicalArrowTable(
  schema: Schema,
  source: ResolvedFederatedSource,
  batch: TableBatch
): ArrowTable {
  const arrowBatch = convertBatch(batch, 'arrow-table');
  const arrowSchema = convertSchemaToArrow(schema);
  const columns: Record<string, arrow.Vector> = {};
  for (const field of arrowSchema.fields) {
    const sourceName = source.sourceNameByOutputName.get(field.name);
    const vector = sourceName ? arrowBatch.data.getChild(sourceName) : null;
    columns[field.name] =
      vector ||
      arrow.vectorFromArray(
        Array.from({length: arrowBatch.length}, () => null),
        field.type
      );
  }
  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, columns)
  };
}

/** Returns exact aggregate row count only when child-local filters and limits cannot change it. */
function getFederatedStatistics(
  sources: readonly ResolvedFederatedSource[]
): {rowCount?: number | bigint} | undefined {
  if (
    sources.some(
      source =>
        source.entry.query?.predicate ||
        source.entry.query?.limit !== undefined ||
        source.metadata.statistics?.rowCount === undefined
    )
  ) {
    return undefined;
  }
  const counts = sources.map(source => source.metadata.statistics!.rowCount!);
  return {
    rowCount: counts.some(count => typeof count === 'bigint')
      ? counts.reduce<bigint>((sum, count) => sum + BigInt(count), 0n)
      : counts.reduce<number>((sum, count) => sum + Number(count), 0)
  };
}

/** Creates serializable per-source explanation details. */
function createSourceExplanation(source: ResolvedFederatedSource): FederatedTableSourceExplain {
  return Object.freeze({
    sourceId: source.entry.dataSourceId,
    sourceIndex: source.sourceIndex,
    sourceType: source.metadata.sourceType,
    sourceColumns: Object.freeze(source.fields.map(field => field.sourceName)),
    outputColumns: Object.freeze(source.fields.map(field => field.outputName)),
    columnMapping: Object.freeze({...source.entry.columnMapping})
  });
}

/** Compares portable data types, including nested types and typed union identifiers. */
function areDataTypesEqual(left: DataType, right: DataType): boolean {
  return formatDataType(left) === formatDataType(right);
}

/** Serializes a portable data type for diagnostics and deterministic equality checks. */
function formatDataType(dataType: DataType): string {
  return typeof dataType === 'string'
    ? dataType
    : JSON.stringify(dataType, (_key, value) =>
        ArrayBuffer.isView(value) ? Array.from(value as unknown as ArrayLike<number>) : value
      );
}

/** Resolves a current, asynchronous, or deferred source through one manager subscription. */
function resolveManagedSource(
  dataSourceManager: DataSourceManager,
  dataSourceId: string,
  consumerId: string,
  requestId: string,
  signal?: AbortSignal
): Promise<ManagedTableScanSource> {
  let resolveDeferredSource!: (source: ManagedTableScanSource) => void;
  let rejectDeferredSource!: (error: unknown) => void;
  const deferredSource = new Promise<ManagedTableScanSource>((resolve, reject) => {
    resolveDeferredSource = resolve;
    rejectDeferredSource = reject;
  });
  const managedSource = dataSourceManager.subscribe<ManagedTableScanSource>({
    dataSourceId,
    consumerId,
    requestId,
    onChange: source => {
      if (source) {
        void Promise.resolve(source).then(resolveDeferredSource, rejectDeferredSource);
      }
    }
  });
  if (managedSource === undefined) {
    throw new Error(`Federated table source is not registered: ${dataSourceId}`);
  }
  return waitForPromise(
    managedSource === null ? deferredSource : Promise.resolve(managedSource),
    signal
  );
}

/** Waits for a managed asynchronous source while preserving operation-local cancellation. */
async function waitForPromise<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return await promise;
  throwIfAborted(signal);
  return await new Promise<T>((resolve, reject) => {
    const abort = () => reject(getAbortReason(signal));
    signal.addEventListener('abort', abort, {once: true});
    void promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

/** Throws the caller's abort reason between resolution, planning, and batch operations. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw getAbortReason(signal);
}

/** Returns a portable cancellation reason when AbortSignal.reason is unavailable. */
function getAbortReason(signal: AbortSignal): unknown {
  return signal.reason || new DOMException('Request aborted', 'AbortError');
}
