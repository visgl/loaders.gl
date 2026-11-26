// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {TableBatch, Schema} from '@loaders.gl/core/schema';
import {
  normalizeTableQuery,
  getColumnarPredicateColumns,
  executeTableScanBatches,
  planTableQuery,
  type TableQuery,
  type TableScanReadOptions,
  type TableScanSource,
  type TableQueryExecutionSummary
} from '@loaders.gl/core/loader-utils';
import {
  convertArrowToSchema,
  convertSchemaToArrow,
  convertTableToArrow,
  makeArrowMetadataBatch,
  makeArrowTableFromBatches
} from '@loaders.gl/core/schema-utils';
import {projectArrowTable, filterArrowTable} from './arrow-execution';
import {filterArrowRows} from './arrow-execution/filter-arrow-table';
import type {QueryOptions} from './query';
import {planQueryPushdown} from './query-pushdown';
import type {SQLQuery} from '@math.gl/sql/parser';
import type {SQLCatalogQuery} from './sql-catalog';

/** Source and query information available before the first physical read. */
type PreparedQuery = {
  /** Validated logical query. */
  logicalQuery: TableQuery | Exclude<SQLQuery, SQLCatalogQuery>;
  /** Resolved table or scan source. */
  source: object;
  /** Native Arrow input when supplied by the caller. */
  inMemory: arrow.Table | null;
  /** Discovery result for a scan source. */
  metadata: Awaited<ReturnType<TableScanSource['getQueryMetadata']>> | undefined;
  /** Whether WHERE requires expression evaluation. */
  castPredicate: boolean;
  /** Whether this request targets catalog metadata. */
  catalogQuery: boolean;
};

/** Executes a prepared query and updates its public completion counters. */
export async function* executePreparedQuery(
  {logicalQuery, source, inMemory, metadata, castPredicate, catalogQuery}: PreparedQuery,
  options: QueryOptions,
  metrics: Pick<
    {-readonly [Key in keyof TableQueryExecutionSummary]: TableQueryExecutionSummary[Key]},
    'sourcesRead' | 'rowsRead' | 'rowsReturned' | 'batchesRead' | 'earlyTerminationReason'
  >
): AsyncGenerator<arrow.RecordBatch> {
  const sourceSchema = inMemory ? inMemory.schema : convertSchemaToArrow(metadata!.schema);
  const names = sourceSchema.fields.map(field => field.name);
  const {select: requestedSelect, where, ...controls} = logicalQuery;
  const computedProjection =
    Array.isArray(requestedSelect) &&
    requestedSelect.some(
      selection =>
        selection &&
        typeof selection === 'object' &&
        ('expression' in selection || 'array' in selection)
    );
  // Resolve the public scan aliases before planning either native or residual projection.
  const select = computedProjection
    ? requestedSelect.map((item, index) =>
        item && typeof item === 'object' && ('expression' in item || 'array' in item)
          ? {...item, as: item.as ?? `column${index + 1}`}
          : item
      )
    : requestedSelect;
  const expressionFilter =
    where && typeof where === 'object' && 'expression' in where ? where : undefined;
  const portablePredicate = expressionFilter ? undefined : (where as TableQuery['where']);
  const normalized = normalizeTableQuery(names, {
    ...controls,
    select: computedProjection ? undefined : (select as TableQuery['select']),
    where: castPredicate ? undefined : portablePredicate
  });
  const expressionTools =
    computedProjection || expressionFilter || castPredicate
      ? await import('./arrow-execution/expressions')
      : undefined;
  const outputColumns = computedProjection
    ? expressionTools!.getProjectionColumns(select!)
    : normalized.select.map(selection => selection.column);
  const expressionColumns = expressionFilter
    ? expressionTools!.getExpressionColumns(expressionFilter.expression)
    : castPredicate && portablePredicate
      ? getColumnarPredicateColumns(portablePredicate)
      : [];
  const required = [...new Set([...outputColumns, ...expressionColumns])];
  const plan = planTableQuery(names, {
    // A literal-only projection still needs a physical column to retain row counts.
    columns: required.length ? required : names.slice(0, 1),
    predicate: normalized.where
  });
  const requiredColumns = plan[0].kind === 'scan' ? plan[0].columns : names;
  const capabilities = (metadata?.queryCapabilities ?? metadata?.capabilities)?.table;
  // read() must perform exact filtering when it advertises pushdown+residual, not only pruning.
  const delegatePredicate = Boolean(
    normalized.where &&
      capabilities &&
      ['pushdown', 'pushdown+residual'].includes(capabilities.predicate)
  );
  const residual = delegatePredicate ? undefined : normalized.where;
  const canDelegateWindow = !residual && !expressionFilter && !castPredicate;
  const delegateOffset = Boolean(
    canDelegateWindow &&
      normalized.offset !== undefined &&
      capabilities &&
      ['pushdown', 'pushdown+residual'].includes(capabilities.offset ?? 'unsupported')
  );
  const requestedRows =
    normalized.limit === undefined
      ? undefined
      : (delegateOffset ? 0 : (normalized.offset ?? 0)) + normalized.limit;
  const readOptions: TableScanReadOptions = {
    signal: options.signal,
    ...(capabilities && capabilities.projection !== 'unsupported'
      ? {columns: requiredColumns}
      : {}),
    ...(delegatePredicate ? {predicate: normalized.where} : {}),
    ...(delegateOffset ? {offset: normalized.offset} : {}),
    ...(canDelegateWindow &&
    requestedRows !== undefined &&
    Number.isSafeInteger(requestedRows) &&
    capabilities &&
    ['pushdown', 'pushdown+residual'].includes(capabilities.limit)
      ? {limit: requestedRows}
      : {})
  };
  const inputSchema = readOptions.columns
    ? sourceSchema.select([...readOptions.columns])
    : sourceSchema;
  const readSchema = convertArrowToSchema(inputSchema);
  const comparisonInputSchema = expressionTools ? convertSchemaToArrow(readSchema) : undefined;
  const compiledFilter = expressionFilter
    ? expressionTools!.compileArrowExpression(expressionFilter.expression, {
        inputSchema,
        functions: options.functions
      })
    : castPredicate && portablePredicate
      ? expressionTools!.compileArrowPredicate(portablePredicate, {inputSchema})
      : undefined;
  if (compiledFilter && !arrow.DataType.isBool(compiledFilter.outputField.type))
    throw new Error('SQL WHERE expression must return Boolean.');
  const project = computedProjection
    ? expressionTools!.prepareArrowProjection(inputSchema, select!, {
        signal: options.signal,
        functions: options.functions
      }).projectTable
    : (data: arrow.Table) => projectArrowTable(data, normalized.select);
  const empty = project(new arrow.Table(inputSchema));
  const comparisonSchema = convertSchemaToArrow(convertArrowToSchema(empty.schema));
  const pushedPlan =
    !inMemory &&
    !options.functions?.length &&
    !catalogQuery &&
    (source as TableScanSource).planQueryPushdown
      ? await planQueryPushdown(
          source as TableScanSource,
          {...logicalQuery, select},
          capabilities,
          comparisonSchema,
          Boolean(computedProjection || expressionFilter),
          inputSchema,
          options.signal
        )
      : null;
  options.signal?.throwIfAborted();
  let emitted = false;
  /** Adapts physical batches without pulling ahead of the query consumer. */
  async function* inputs(): AsyncIterable<arrow.Table> {
    metrics.sourcesRead = 1;
    const batches: AsyncIterable<unknown> = pushedPlan
      ? pushedPlan.read({signal: options.signal})
      : inMemory
        ? memoryBatches(inMemory)
        : (source as TableScanSource).read(readOptions);
    for await (const value of batches) {
      options.signal?.throwIfAborted();
      let batch = normalizeBatch(value, pushedPlan?.schema ?? readSchema);
      if (
        !pushedPlan &&
        comparisonInputSchema &&
        !arrow.util.compareSchemas(
          comparisonInputSchema,
          convertSchemaToArrow(convertArrowToSchema(batch.schema))
        )
      ) {
        // A source may return a wider or differently ordered projection than requested.
        batch = batch.select(inputSchema.names);
        if (
          !arrow.util.compareSchemas(
            comparisonInputSchema,
            convertSchemaToArrow(convertArrowToSchema(batch.schema))
          )
        )
          throw new Error('Query input schema does not match source metadata.');
      }
      metrics.batchesRead++;
      metrics.rowsRead += batch.numRows;
      yield batch;
    }
  }
  for await (const value of executeTableScanBatches<arrow.Table>(
    () => inputs(),
    {
      predicate: pushedPlan ? undefined : residual,
      offset: pushedPlan || delegateOffset ? undefined : normalized.offset,
      limit: normalized.limit,
      skipEmptyBatches: true,
      signal: options.signal
    },
    {
      filter: (batch, predicate, signal) => {
        if (pushedPlan) return batch;
        if (compiledFilter) {
          return filterArrowRows(
            batch,
            recordBatch => {
              const matches = compiledFilter.evaluate(recordBatch, {signal});
              return index => matches.get(index) === true;
            },
            {signal}
          );
        }
        return predicate ? filterArrowTable(batch, predicate, {signal}) : batch;
      },
      project: batch => (pushedPlan || computedProjection ? batch : project(batch))
    }
  )) {
    const finishProjection = pushedPlan
      ? pushedPlan.project
      : computedProjection
        ? project
        : undefined;
    const batch = finishProjection ? finishProjection(value) : value;
    if (
      !arrow.util.compareSchemas(
        comparisonSchema,
        convertSchemaToArrow(convertArrowToSchema(batch.schema))
      )
    )
      throw new Error('Query output schema does not match source metadata.');
    emitted = true;
    metrics.rowsReturned += batch.numRows;
    if (batch.batches.length) yield* batch.batches;
    else yield makeArrowMetadataBatch(batch.schema);
  }
  // An empty schema-bearing batch makes collected and streaming empty results identical.
  if (!emitted) {
    if (empty.batches.length) yield* empty.batches;
    else yield makeArrowMetadataBatch(empty.schema);
  }
  if (normalized.limit !== undefined && metrics.rowsReturned >= normalized.limit)
    metrics.earlyTerminationReason = 'limit';
}

export {makeArrowTableFromBatches};

/** Emits original Arrow RecordBatches without copying their buffers. */
async function* memoryBatches(data: arrow.Table): AsyncIterable<arrow.Table> {
  for (const batch of data.batches) yield new arrow.Table(data.schema, [batch]);
}

/** Converts supported native table batches to Arrow while preserving their declared schema. */
function normalizeBatch(value: unknown, fallbackSchema: Schema): arrow.Table {
  if (!value || typeof value !== 'object') throw new Error('Unsupported query batch.');
  if ('numRows' in value) {
    const batch = value as arrow.RecordBatch;
    return new arrow.Table(batch.schema, [batch]);
  }
  if (!('shape' in value)) throw new Error('Unsupported query batch.');
  const input = value as TableBatch;
  const batch = {...input, schema: input.schema ?? fallbackSchema} as TableBatch;
  if (!['object-row-table', 'array-row-table', 'columnar-table'].includes(batch.shape))
    throw new Error(`Unsupported query batch shape: ${batch.shape}`);
  return batch.length === 0 && batch.schema
    ? new arrow.Table(convertSchemaToArrow(batch.schema))
    : convertTableToArrow(batch);
}
