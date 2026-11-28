// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RecordBatch, Table} from 'apache-arrow';
import {makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import {
  compileColumnarPredicate,
  createScanQueryMetadata,
  DataSource,
  executeTableScanBatches,
  getColumnarPredicatePath,
  getColumnarPredicatePaths,
  getLoaderLog,
  validateColumnarPredicate
} from '@loaders.gl/core/loader-utils';
import type {
  ColumnarPredicate,
  ColumnarPredicateValue,
  CoreAPI,
  DataSourceOptions,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import type {Schema} from '@loaders.gl/core/schema';
import type {JSONArrowScan} from './lib/parsers/parse-direct-json-arrow';
import type {JSONArrowConversionOptions} from './lib/parsers/convert-row-table-to-arrow';
import type {JSONTableLoaderOptions} from './json-table-loader-types';

/** JSON parser options for a source that always scans Arrow batches. */
export type JSONTableSourceOptions = DataSourceOptions & {
  json?: Omit<NonNullable<JSONTableLoaderOptions['json']>, 'shape'> & {
    /** Infer from the full document by default, or freeze after the first 1024 rows. */
    schemaInference?: 'full' | 'first-batch';
  };
};

/** Reads a JSON row array from a URL or Blob and scans the result as Arrow batches. */
export class JSONTableSource
  extends DataSource<string | Blob, JSONTableSourceOptions>
  implements TableScanSource<RecordBatch>
{
  private table: Table | undefined;
  private revision = 0;

  /** Creates a source without loading or parsing the JSON. */
  constructor(data: string | Blob, options: JSONTableSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Drops the decoded table so the next query can observe source changes. */
  override setNeedsRefresh(): void {
    super.setNeedsRefresh();
    this.revision++;
    this.table = undefined;
  }

  /** Discovers the schema according to the inference policy and reports scan capabilities. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    options.signal?.throwIfAborted();
    const json = this.options.json;
    const declaredSchema = json?.schema;
    const streaming = Boolean(declaredSchema || json?.schemaInference === 'first-batch');
    let schema: Schema;
    if (declaredSchema) {
      const {normalizeJSONArrowSchema} = await import('./lib/parsers/convert-row-table-to-arrow');
      schema = normalizeJSONArrowSchema(declaredSchema);
    } else if (streaming) {
      const {parseDirectJSONArrowInBatches} = await import('./lib/parsers/parse-direct-json-arrow');
      schema = {fields: [], metadata: {}};
      for await (const batch of parseDirectJSONArrowInBatches(
        this.readBytes(options.signal),
        undefined,
        json?.jsonpaths,
        1024,
        this.getConversionOptions(),
        {ignoreLateFields: true}
      )) {
        schema = convertArrowToSchema(batch.schema);
        break;
      }
    } else {
      schema = convertArrowToSchema((await this.loadTable(options.signal)).schema);
    }
    return createScanQueryMetadata({
      sourceType: 'json-table',
      name: this.name,
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      schema,
      capabilities: {
        table: {
          predicate: declaredSchema ? 'pushdown+residual' : 'residual',
          projection: 'pushdown+residual',
          limit: streaming ? 'pushdown' : 'residual',
          streaming,
          cancellation: true
        }
      }
    });
  }

  /** Pushes supported scan options into the parser and yields Arrow result batches. */
  async *read(options: TableScanReadOptions = {}): AsyncIterable<RecordBatch> {
    const source = this;
    const json = this.options.json;
    const conversion = this.getConversionOptions();
    const schema = json?.schema
      ? (await import('./lib/parsers/convert-row-table-to-arrow')).normalizeJSONArrowSchema(
          json.schema
        )
      : undefined;
    const predicateTools = options.predicate
      ? await import('./lib/parsers/convert-row-table-to-arrow')
      : undefined;
    const accept =
      schema && options.predicate
        ? planSimplePredicate(
            schema,
            options.predicate,
            conversion,
            predicateTools!.makeJSONArrowPredicateValueReader
          )
        : undefined;
    const residual = accept ? undefined : options.predicate;
    const columns =
      options.columns &&
      new Set([
        ...options.columns,
        ...(options.predicate
          ? getColumnarPredicatePaths(options.predicate).map(([name]) => name)
          : [])
      ]);
    const inference = !schema && json?.schemaInference === 'first-batch';
    let inferredPredicatePushed = false;
    const scan: JSONArrowScan = {
      columns,
      accept,
      ignoreLateFields: inference,
      prepareInferredPredicate:
        !schema && options.predicate
          ? inferredSchema => {
              const inferredPredicate = planSimplePredicate(
                inferredSchema,
                options.predicate!,
                {...conversion, allowMissingNullableFields: true},
                predicateTools!.makeJSONArrowPredicateValueReader
              );
              inferredPredicatePushed = Boolean(inferredPredicate);
              return inferredPredicate;
            }
          : undefined
    };
    for await (const batch of executeTableScanBatches<Table>(
      async function* (signal, onByteLength) {
        if (schema || inference) {
          const {Table: ArrowTable} = await import('apache-arrow');
          const {parseDirectJSONArrowInBatches} = await import(
            './lib/parsers/parse-direct-json-arrow'
          );
          const batchSize = Math.min(
            1024,
            !inference && !residual ? (options.offset ?? 0) + (options.limit ?? Infinity) : Infinity
          );
          for await (const batch of parseDirectJSONArrowInBatches(
            source.readBytes(signal, onByteLength),
            schema,
            json?.jsonpaths,
            batchSize,
            conversion,
            scan
          )) {
            yield new ArrowTable([batch]);
          }
        } else if ((columns || residual) && !source.table) {
          const {parseDirectJSONArrowText} = await import('./lib/parsers/parse-direct-json-arrow');
          const input = await source.openInput(signal);
          const bytes = await input.arrayBuffer();
          onByteLength?.(bytes.byteLength);
          signal?.throwIfAborted();
          yield parseDirectJSONArrowText(
            new TextDecoder().decode(bytes),
            undefined,
            conversion,
            scan
          );
        } else {
          yield await source.loadTable(signal, onByteLength);
        }
      },
      {...options, predicate: residual},
      {
        async filter(batch, predicate, signal) {
          if (!predicate || inferredPredicatePushed) {
            return batch;
          }
          const {filterArrowTable} = await import('@loaders.gl/core/query/arrow-execution');
          return filterArrowTable(batch, predicate, {signal});
        }
      }
    )) {
      if (batch.batches.length) yield* batch.batches;
      else yield makeArrowMetadataBatch(batch.schema);
    }
  }

  private getConversionOptions(): JSONArrowConversionOptions {
    return {
      arrowConversion: this.options.json?.arrowConversion,
      log: getLoaderLog(this.loadOptions)
    };
  }

  /** Reads bytes incrementally and cancels the reader when a scan ends early. */
  private async *readBytes(
    signal?: AbortSignal,
    onByteLength?: (byteLength: number) => void
  ): AsyncIterable<Uint8Array> {
    signal?.throwIfAborted();
    const input = await this.openInput(signal);
    const stream = input instanceof Response ? input.body : input.stream();
    if (!stream) return;
    const reader = stream.getReader();
    const abort = () => void reader.cancel().catch(() => {});
    signal?.addEventListener('abort', abort, {once: true});
    try {
      signal?.throwIfAborted();
      while (true) {
        const result = await reader.read();
        signal?.throwIfAborted();
        if (result.done) return;
        onByteLength?.(result.value.byteLength);
        yield result.value;
      }
    } finally {
      signal?.removeEventListener('abort', abort);
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  }

  private async openInput(signal?: AbortSignal): Promise<Response | Blob> {
    const input = typeof this.data === 'string' ? await this.fetch(this.url, {signal}) : this.data;
    if (input instanceof Response && !input.ok) {
      throw new Error(`JSON table source request failed with status ${input.status}`);
    }
    return input;
  }

  /** Loads the document once for sequential metadata and scan requests. */
  private async loadTable(
    signal?: AbortSignal,
    onByteLength?: (byteLength: number) => void
  ): Promise<Table> {
    signal?.throwIfAborted();
    if (this.table) {
      return this.table;
    }
    const revision = this.revision;
    const json = this.options.json;
    const loadOptions = this.loadOptions;
    const {JSONTableLoaderWithParser} = await import('./json-table-loader');
    signal?.throwIfAborted();
    const input = await this.openInput(signal);
    const bytes = await input.arrayBuffer();
    onByteLength?.(bytes.byteLength);
    signal?.throwIfAborted();
    const table = await JSONTableLoaderWithParser.parse(bytes, {
      ...loadOptions,
      json: {...json, shape: 'arrow'}
    });
    signal?.throwIfAborted();
    if ('shape' in table) {
      throw new Error('JSON table source expected an Arrow table');
    }
    if (this.revision === revision) {
      this.table = table;
    }
    return table;
  }
}

/** Compiles simple scalar predicates against the same logical values the Arrow writer sees. */
function planSimplePredicate(
  schema: Schema,
  predicate: NonNullable<TableScanReadOptions['predicate']>,
  options: JSONArrowConversionOptions,
  makeReader: typeof import('./lib/parsers/convert-row-table-to-arrow').makeJSONArrowPredicateValueReader
): JSONArrowScan['accept'] {
  validateColumnarPredicate(predicate, new Set(schema.fields.map(field => field.name)));
  const property = predicate.args[0];
  if (!('property' in property)) return undefined;
  const path = getColumnarPredicatePath(property);
  if (path.length !== 1 || property.casts?.length) return undefined;
  const field = schema.fields.find(candidate => candidate.name === path[0]);
  // These scalar types preserve their logical value without Arrow storage coercions.
  if (!field || (field.type !== 'float64' && field.type !== 'bool')) return undefined;

  const read = makeReader(field, options);
  let value: ColumnarPredicateValue | null | undefined;
  const evaluate = compileColumnarPredicate(predicate as ColumnarPredicate, () => () => value);
  return fields => {
    value = read(fields) as typeof value;
    return evaluate(0) === true;
  };
}
