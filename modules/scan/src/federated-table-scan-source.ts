// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  createScanQueryMetadata,
  emitScanExecutionTelemetry,
  explainTableQuery,
  getColumnarPredicateColumns,
  planTableQuery,
  type DataSourceManager,
  type ManageableDataSource,
  type ScanQueryMetadata,
  type ScanQueryMetadataOptions,
  type ScanExecutionTelemetry,
  type ScanExecutionTelemetryStatus,
  type ScanSourceExecutionTelemetry,
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
  query?: Omit<TableScanReadOptions<SQLPredicate>, 'signal' | 'onTelemetry'>;
  /** Source-column to federated-column renames applied before compatibility checks. */
  columnMapping?: Readonly<Record<string, string>>;
}>;

/** Options for an ordered federated table source. */
export type FederatedTableScanSourceOptions = Readonly<{
  /** Named sources appended in caller-specified order. */
  sources: readonly FederatedTableSourceEntry[];
  /** Strict requires matching columns; union null-fills missing columns. Defaults to strict. */
  schemaPolicy?: FederatedTableSchemaPolicy;
  /** Explicit federated schema used to validate, order, and safely normalize physical columns. */
  outputSchema?: Schema;
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
  /** Output types that require an explicit lossless normalization for this source. */
  normalizedTypes: Readonly<Record<string, DataType>>;
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

type MutableScanExecutionTelemetry = {
  status: ScanExecutionTelemetryStatus;
  sourcesPlanned: number;
  sourcesRead: number;
  batchesRead: number;
  rowsRead: number;
  rowsTested: number;
  rowsRetained: number;
  rowsReturned: number;
  bytesFetched: number;
  filesOpened: number;
  tasksOpened: number;
  rowsPruned: number;
  durationMilliseconds: number;
  earlyTerminationReason?: ScanExecutionTelemetry['earlyTerminationReason'];
  sources: ScanSourceExecutionTelemetry[];
  error?: unknown;
};

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
  /** Optional caller-declared normalized output schema. */
  readonly outputSchema?: Schema;
  /** Optional display name reported through scan metadata. */
  readonly name?: string;
  /** Human-readable description reported through scan metadata. */
  readonly description: string;

  /** Stable id used to isolate this adapter's manager subscriptions. */
  private readonly instanceId = nextFederatedSourceId++;
  /** Monotonic id used to isolate overlapping operations on this adapter. */
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
    this.outputSchema = options.outputSchema ? cloneSchema(options.outputSchema) : undefined;
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
        sources: Object.freeze(
          plan.sources.map(source => createSourceExplanation(source, plan.schema))
        )
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
    const startedAt = Date.now();
    const telemetry: MutableScanExecutionTelemetry = {
      status: 'early-terminated',
      sourcesPlanned: this.sources.length,
      sourcesRead: 0,
      batchesRead: 0,
      rowsRead: 0,
      rowsTested: 0,
      rowsRetained: 0,
      rowsReturned: 0,
      bytesFetched: 0,
      filesOpened: 0,
      tasksOpened: 0,
      rowsPruned: 0,
      durationMilliseconds: 0,
      sources: []
    };
    try {
      const plan = await this.resolvePlan(consumerId, options.signal);
      const scanStep = planTableQuery(
        plan.schema.fields.map(field => field.name),
        options
      )[0] as Readonly<{columns: readonly string[]}>;
      let remaining = options.limit ?? Number.POSITIVE_INFINITY;
      if (remaining <= 0) {
        telemetry.earlyTerminationReason = 'limit';
        return;
      }

      for (const resolvedSource of plan.sources) {
        throwIfAborted(options.signal);
        if (remaining <= 0) {
          telemetry.earlyTerminationReason = 'limit';
          return;
        }
        const sourceStartedAt = Date.now();
        let childTelemetry: ScanExecutionTelemetry | undefined;
        let sourceCompleted = false;
        let sourceError: unknown;
        let sourceBatchesDecoded = 0;
        let sourceRowsRead = 0;
        let sourceRowsTested = 0;
        let sourceRowsRetained = 0;
        let sourceRowsReturned = 0;
        const sourceReadOptions = createSourceReadOptions(
          resolvedSource,
          scanStep.columns,
          remaining,
          options,
          value => {
            childTelemetry = value;
          }
        );
        const sourceResidualPredicate = getSourceResidualPredicate(resolvedSource);
        let sourceRemaining = resolvedSource.entry.query?.limit ?? Number.POSITIVE_INFINITY;
        telemetry.sourcesRead++;
        let sourceBatchIndex = 0;
        try {
          for await (const batch of resolvedSource.source.read(sourceReadOptions)) {
            throwIfAborted(options.signal);
            if (remaining <= 0) {
              telemetry.earlyTerminationReason = 'limit';
              return;
            }
            if (sourceRemaining <= 0) break;
            if (batch.batchType !== 'data') continue;
            telemetry.batchesRead++;
            telemetry.rowsRead += batch.length;
            sourceBatchesDecoded++;
            sourceRowsRead += batch.length;
            if (batch.length <= 0) continue;
            const physicalTable = convertBatch(
              batch.schema ? batch : {...batch, schema: resolvedSource.metadata.schema},
              'arrow-table'
            );
            const sourceResult = queryArrowTable(physicalTable, {
              predicate: sourceResidualPredicate,
              limit: Number.isFinite(sourceRemaining) ? sourceRemaining : undefined,
              signal: options.signal
            });
            if (sourceResidualPredicate) {
              sourceRowsTested += physicalTable.data.numRows;
              sourceRowsRetained += sourceResult.data.numRows;
            }
            sourceRemaining -= sourceResult.data.numRows;
            const currentSourceBatchIndex = sourceBatchIndex++;
            if (!sourceResult.data.numRows) continue;
            const canonicalTable = createCanonicalArrowTable(
              plan.schema,
              resolvedSource,
              sourceResult
            );
            const result = queryArrowTable(canonicalTable, {
              predicate: options.predicate,
              columns: options.columns,
              limit: Number.isFinite(remaining) ? remaining : undefined,
              signal: options.signal
            });
            if (options.predicate) {
              telemetry.rowsTested += canonicalTable.data.numRows;
              telemetry.rowsRetained += result.data.numRows;
            }
            const resultLength = result.data.numRows;
            if (!resultLength) continue;
            const provenance: FederatedTableBatchProvenance = Object.freeze({
              sourceId: resolvedSource.entry.dataSourceId,
              sourceIndex: resolvedSource.sourceIndex,
              sourceBatchIndex: currentSourceBatchIndex,
              sourceMetadata: batch.metadata
            });
            telemetry.rowsReturned += resultLength;
            sourceRowsReturned += resultLength;
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
          sourceCompleted = true;
        } catch (error) {
          sourceError = error;
          throw error;
        } finally {
          const sourceTelemetry = createSourceTelemetry({
            resolvedSource,
            childTelemetry,
            sourceStartedAt,
            sourceCompleted,
            sourceError,
            signal: options.signal,
            batchesDecoded: sourceBatchesDecoded,
            rowsRead: sourceRowsRead,
            rowsTested: sourceRowsTested,
            rowsRetained: sourceRowsRetained,
            rowsReturned: sourceRowsReturned
          });
          telemetry.sources.push(sourceTelemetry);
          telemetry.bytesFetched += sourceTelemetry.bytesFetched || 0;
          telemetry.filesOpened += sourceTelemetry.filesOpened || 0;
          telemetry.tasksOpened += sourceTelemetry.tasksOpened || 0;
          telemetry.rowsPruned += sourceTelemetry.rowsPruned || 0;
        }
      }
      telemetry.status = 'completed';
    } catch (error) {
      telemetry.status = options.signal?.aborted ? 'cancelled' : 'failed';
      telemetry.error = error;
      throw error;
    } finally {
      this.dataSourceManager.unsubscribe({consumerId});
      telemetry.durationMilliseconds = Date.now() - startedAt;
      if (telemetry.status === 'early-terminated' && !telemetry.earlyTerminationReason) {
        telemetry.earlyTerminationReason = 'consumer-return';
      }
      emitScanExecutionTelemetry(
        options.onTelemetry,
        Object.freeze({
          ...telemetry,
          batchesDecoded: telemetry.batchesRead,
          sources: Object.freeze([...telemetry.sources])
        }) satisfies ScanExecutionTelemetry
      );
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
      schema: reconcileSchemas(sources, this.schemaPolicy, this.outputSchema),
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
  schemaPolicy: FederatedTableSchemaPolicy,
  outputSchema?: Schema
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
        if (!outputSchema && !areDataTypesEqual(current.type, mappedField.field.type)) {
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
  const inferredSchema = {fields, metadata: {}};
  return outputSchema
    ? validateAndCloneOutputSchema(outputSchema, sources, inferredSchema, schemaPolicy)
    : inferredSchema;
}

/** Validates an explicit output contract and permits only deterministic lossless casts. */
function validateAndCloneOutputSchema(
  outputSchema: Schema,
  sources: readonly ResolvedFederatedSource[],
  inferredSchema: Schema,
  schemaPolicy: FederatedTableSchemaPolicy
): Schema {
  const outputFields = new Map<string, Field>();
  for (const field of outputSchema.fields) {
    if (!field.name || outputFields.has(field.name)) {
      throw new Error(
        `Federated output schema contains an invalid or duplicate field: ${field.name}`
      );
    }
    outputFields.set(field.name, field);
  }
  const inferredNames = new Set(inferredSchema.fields.map(field => field.name));
  const missingFromContract = [...inferredNames].filter(name => !outputFields.has(name));
  const absentFromSources = outputSchema.fields
    .map(field => field.name)
    .filter(name => !inferredNames.has(name));
  if (missingFromContract.length || (schemaPolicy === 'strict' && absentFromSources.length)) {
    throw new Error(
      `Federated output schema mismatch: missing [${missingFromContract.join(', ')}], absent [${absentFromSources.join(', ')}]`
    );
  }
  for (const outputField of outputSchema.fields) {
    const presentFields = sources.flatMap(source =>
      source.fields
        .filter(field => field.outputName === outputField.name)
        .map(field => ({sourceId: source.entry.dataSourceId, field: field.field}))
    );
    if (!presentFields.length) {
      if (!outputField.nullable) {
        throw new Error(
          `Federated output field is absent from every source and must be nullable: ${outputField.name}`
        );
      }
      continue;
    }
    for (const presentField of presentFields) {
      if (presentField.field.nullable && !outputField.nullable) {
        throw new Error(
          `Federated output field cannot remove nullability for ${outputField.name} in ${presentField.sourceId}`
        );
      }
      if (!isLosslessDataTypeCast(presentField.field.type, outputField.type)) {
        throw new Error(
          `Unsupported federated normalization for ${outputField.name}: ${formatDataType(presentField.field.type)} to ${formatDataType(outputField.type)} in ${presentField.sourceId}`
        );
      }
    }
    if (presentFields.length < sources.length && !outputField.nullable) {
      throw new Error(
        `Federated union field must be nullable when absent from a source: ${outputField.name}`
      );
    }
  }
  return cloneSchema(outputSchema);
}

/** Creates the source-local query required by the global canonical scan step. */
function createSourceReadOptions(
  source: ResolvedFederatedSource,
  requiredOutputColumns: readonly string[],
  remaining: number,
  options: TableScanReadOptions<SQLPredicate>,
  onTelemetry: (telemetry: ScanExecutionTelemetry) => void
): TableScanReadOptions<SQLPredicate> {
  const sourceResidualPredicate = getSourceResidualPredicate(source);
  const requiredSourceColumns = requiredOutputColumns
    .map(outputName => source.sourceNameByOutputName.get(outputName))
    .filter((sourceName): sourceName is string => Boolean(sourceName));
  if (sourceResidualPredicate) {
    requiredSourceColumns.push(...getColumnarPredicateColumns(sourceResidualPredicate));
  }
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
    predicate: sourceResidualPredicate ? undefined : source.entry.query?.predicate,
    limit: sourceResidualPredicate ? undefined : Number.isFinite(limit) ? limit : undefined,
    signal: options.signal,
    onTelemetry
  };
}

/** Returns the source-local predicate when the child requires residual execution. */
function getSourceResidualPredicate(source: ResolvedFederatedSource): SQLPredicate | undefined {
  return source.metadata.capabilities.table?.predicate === 'unsupported'
    ? source.entry.query?.predicate
    : undefined;
}

/** Converts one physical batch to the reconciled Arrow schema, renaming and null-filling fields. */
function createCanonicalArrowTable(
  schema: Schema,
  source: ResolvedFederatedSource,
  physicalTable: ArrowTable
): ArrowTable {
  const arrowSchema = convertSchemaToArrow(schema);
  const columns: Record<string, arrow.Vector> = {};
  for (const field of arrowSchema.fields) {
    const sourceName = source.sourceNameByOutputName.get(field.name);
    const vector = sourceName ? physicalTable.data.getChild(sourceName) : null;
    const mappedField = source.fields.find(sourceField => sourceField.outputName === field.name);
    columns[field.name] = vector
      ? mappedField &&
        !areDataTypesEqual(
          mappedField.field.type,
          schema.fields.find(schemaField => schemaField.name === field.name)!.type
        )
        ? arrow.vectorFromArray(Array.from(vector), field.type)
        : vector
      : arrow.vectorFromArray(
          Array.from({length: physicalTable.data.numRows}, () => null),
          field.type
        );
  }
  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(arrowSchema, columns)
  };
}

/** Creates one portable per-source telemetry record and preserves source-specific counters. */
function createSourceTelemetry(
  options: Readonly<{
    resolvedSource: ResolvedFederatedSource;
    childTelemetry?: ScanExecutionTelemetry;
    sourceStartedAt: number;
    sourceCompleted: boolean;
    sourceError?: unknown;
    signal?: AbortSignal;
    batchesDecoded: number;
    rowsRead: number;
    rowsTested: number;
    rowsRetained: number;
    rowsReturned: number;
  }>
): ScanSourceExecutionTelemetry {
  const {resolvedSource, childTelemetry} = options;
  const status: ScanExecutionTelemetryStatus =
    childTelemetry?.status ||
    (options.signal?.aborted
      ? 'cancelled'
      : options.sourceError
        ? 'failed'
        : options.sourceCompleted
          ? 'completed'
          : 'early-terminated');
  const details = childTelemetry
    ? Object.freeze(
        Object.fromEntries(
          Object.entries(childTelemetry).filter(
            ([key]) =>
              ![
                'status',
                'sourcesPlanned',
                'sourcesRead',
                'batchesRead',
                'batchesDecoded',
                'rowsRead',
                'rowsTested',
                'rowsRetained',
                'rowsReturned',
                'bytesRead',
                'bytesFetched',
                'filesOpened',
                'tasksOpened',
                'rowsPruned',
                'durationMilliseconds',
                'sources',
                'details',
                'error'
              ].includes(key)
          )
        )
      )
    : undefined;
  return Object.freeze({
    sourceId: resolvedSource.entry.dataSourceId,
    sourceType: resolvedSource.metadata.sourceType,
    sourceIndex: resolvedSource.sourceIndex,
    status,
    filesOpened: childTelemetry?.filesOpened,
    tasksOpened: childTelemetry?.tasksOpened,
    bytesFetched: childTelemetry?.bytesFetched ?? childTelemetry?.bytesRead,
    batchesDecoded: childTelemetry?.batchesDecoded ?? options.batchesDecoded,
    rowsRead: childTelemetry?.rowsRead ?? options.rowsRead,
    rowsTested: childTelemetry?.rowsTested || options.rowsTested || undefined,
    rowsRetained: childTelemetry?.rowsRetained || options.rowsRetained || undefined,
    rowsReturned: options.rowsReturned,
    rowsPruned: childTelemetry?.rowsPruned,
    durationMilliseconds: Date.now() - options.sourceStartedAt,
    details:
      childTelemetry?.details ?? (details && Object.keys(details).length ? details : undefined),
    error: childTelemetry?.error ?? options.sourceError
  });
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
function createSourceExplanation(
  source: ResolvedFederatedSource,
  outputSchema: Schema
): FederatedTableSourceExplain {
  const normalizedTypes = Object.fromEntries(
    source.fields
      .filter(field => {
        const outputField = outputSchema.fields.find(
          schemaField => schemaField.name === field.outputName
        );
        return outputField && !areDataTypesEqual(outputField.type, field.field.type);
      })
      .map(field => [
        field.outputName,
        outputSchema.fields.find(schemaField => schemaField.name === field.outputName)!.type
      ])
  );
  return Object.freeze({
    sourceId: source.entry.dataSourceId,
    sourceIndex: source.sourceIndex,
    sourceType: source.metadata.sourceType,
    sourceColumns: Object.freeze(source.fields.map(field => field.sourceName)),
    outputColumns: Object.freeze(source.fields.map(field => field.outputName)),
    columnMapping: Object.freeze({...source.entry.columnMapping}),
    normalizedTypes: Object.freeze(normalizedTypes)
  });
}

/** Returns true when Arrow can normalize values without narrowing or changing their domain. */
function isLosslessDataTypeCast(sourceType: DataType, outputType: DataType): boolean {
  if (areDataTypesEqual(sourceType, outputType) || sourceType === 'null') return true;
  if (typeof sourceType === 'object' && sourceType.type === 'dictionary') {
    return isLosslessDataTypeCast(sourceType.dictionary, outputType);
  }
  if (sourceType === 'utf8-view' && outputType === 'utf8') return true;
  if (sourceType === 'binary-view' && outputType === 'binary') return true;
  const sourceInteger = getIntegerType(sourceType);
  const outputInteger = getIntegerType(outputType);
  if (sourceInteger && outputInteger) {
    return (
      (sourceInteger.signed === outputInteger.signed && sourceInteger.bits <= outputInteger.bits) ||
      (!sourceInteger.signed && outputInteger.signed && sourceInteger.bits < outputInteger.bits)
    );
  }
  const sourceFloatBits = getFloatBits(sourceType);
  const outputFloatBits = getFloatBits(outputType);
  if (sourceFloatBits && outputFloatBits) return sourceFloatBits <= outputFloatBits;
  return Boolean(sourceInteger && sourceInteger.bits <= 32 && outputFloatBits === 64);
}

/** Returns the signedness and width for portable integer aliases. */
function getIntegerType(dataType: DataType): {signed: boolean; bits: number} | null {
  const types: Partial<Record<string, {signed: boolean; bits: number}>> = {
    int: {signed: true, bits: 32},
    int8: {signed: true, bits: 8},
    int16: {signed: true, bits: 16},
    int32: {signed: true, bits: 32},
    int64: {signed: true, bits: 64},
    uint8: {signed: false, bits: 8},
    uint16: {signed: false, bits: 16},
    uint32: {signed: false, bits: 32},
    uint64: {signed: false, bits: 64}
  };
  return typeof dataType === 'string' ? types[dataType] || null : null;
}

/** Returns the width for portable floating-point aliases. */
function getFloatBits(dataType: DataType): number | null {
  const types: Partial<Record<string, number>> = {float: 32, float16: 16, float32: 32, float64: 64};
  return typeof dataType === 'string' ? types[dataType] || null : null;
}

/** Clones a portable schema through the canonical Arrow serializer. */
function cloneSchema(schema: Schema): Schema {
  return convertArrowToSchema(convertSchemaToArrow(schema));
}

/** Compares portable data types, including nested types and typed union identifiers. */
function areDataTypesEqual(left: DataType, right: DataType): boolean {
  return formatDataType(left) === formatDataType(right);
}

/** Serializes a portable data type for diagnostics and deterministic equality checks. */
function formatDataType(dataType: DataType): string {
  return typeof dataType === 'string' ? dataType : JSON.stringify(canonicalizeValue(dataType));
}

/** Canonicalizes object keys while preserving array and typed-array element order. */
function canonicalizeValue(value: unknown): unknown {
  if (ArrayBuffer.isView(value)) {
    return Array.from(value as unknown as ArrayLike<number>);
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, child]) => [key, canonicalizeValue(child)])
    );
  }
  return value;
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
  let sourceGeneration = 0;
  const acceptSource = (
    source: ManagedTableScanSource | Promise<ManagedTableScanSource> | null
  ): void => {
    const generation = ++sourceGeneration;
    if (source) {
      void Promise.resolve(source).then(
        result => {
          if (generation === sourceGeneration) resolveDeferredSource(result);
        },
        error => {
          if (generation === sourceGeneration) rejectDeferredSource(error);
        }
      );
    }
  };
  const managedSource = dataSourceManager.subscribe<ManagedTableScanSource>({
    dataSourceId,
    consumerId,
    requestId,
    onChange: acceptSource
  });
  if (managedSource === undefined) {
    throw new Error(`Federated table source is not registered: ${dataSourceId}`);
  }
  acceptSource(managedSource || null);
  return waitForPromise(deferredSource, signal);
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
