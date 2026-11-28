// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RecordBatch, Table} from 'apache-arrow';
import {makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import {
  createScanQueryMetadata,
  DataSource,
  executeTableScanBatches,
  getLoaderLog
} from '@loaders.gl/core/loader-utils';
import type {
  CoreAPI,
  DataSourceOptions,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import type {JSONTableLoaderOptions} from './json-table-loader-types';

/** JSON parser options for a source that always scans Arrow batches. */
export type JSONTableSourceOptions = DataSourceOptions & {
  json?: Omit<NonNullable<JSONTableLoaderOptions['json']>, 'shape'>;
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

  /** Reads the decoded schema and reports query operations available after parsing. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    options.signal?.throwIfAborted();
    const declaredSchema = this.options.json?.schema;
    const schema = declaredSchema
      ? (await import('./lib/parsers/convert-row-table-to-arrow')).normalizeJSONArrowSchema(
          declaredSchema
        )
      : convertArrowToSchema((await this.loadTable(options.signal)).schema);
    return createScanQueryMetadata({
      sourceType: 'json-table',
      name: this.name,
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      schema,
      capabilities: {
        table: {
          predicate: 'residual',
          projection: 'residual',
          limit: declaredSchema ? 'pushdown' : 'residual',
          streaming: Boolean(declaredSchema),
          cancellation: true
        }
      }
    });
  }

  /** Applies scan options to the decoded table and yields the result batch. */
  async *read(options: TableScanReadOptions = {}): AsyncIterable<RecordBatch> {
    const source = this;
    const json = this.options.json;
    for await (const batch of executeTableScanBatches<Table>(
      async function* (signal, onByteLength) {
        if (json?.schema) {
          const {Table: ArrowTable} = await import('apache-arrow');
          const {normalizeJSONArrowSchema} = await import(
            './lib/parsers/convert-row-table-to-arrow'
          );
          const {parseDirectJSONArrowInBatches} = await import(
            './lib/parsers/parse-direct-json-arrow'
          );
          const batchSize = Math.min(
            1024,
            !options.predicate ? (options.offset ?? 0) + (options.limit ?? Infinity) : Infinity
          );
          for await (const batch of parseDirectJSONArrowInBatches(
            source.readBytes(signal, onByteLength),
            normalizeJSONArrowSchema(json.schema),
            json.jsonpaths,
            batchSize,
            {arrowConversion: json.arrowConversion, log: getLoaderLog(source.loadOptions)}
          )) {
            yield new ArrowTable([batch]);
          }
        } else {
          yield await source.loadTable(signal, onByteLength);
        }
      },
      options,
      {
        async filter(batch, predicate, signal) {
          if (!predicate) {
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
