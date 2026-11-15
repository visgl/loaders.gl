// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RecordBatch, Table} from 'apache-arrow';
import {makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import {
  createScanQueryMetadata,
  DataSource,
  executeTableScanBatches
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

/** Reads a JSON row array from a URL or Blob and scans the decoded Arrow table. */
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
    const table = await this.loadTable(options.signal);
    return createScanQueryMetadata({
      sourceType: 'json-table',
      name: this.name,
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      schema: convertArrowToSchema(table.schema),
      capabilities: {
        table: {
          predicate: 'residual',
          projection: 'residual',
          limit: 'residual',
          streaming: false,
          cancellation: true
        }
      }
    });
  }

  /** Applies scan options to the decoded table and yields the result batch. */
  async *read(options: TableScanReadOptions = {}): AsyncIterable<RecordBatch> {
    const source = this;
    for await (const batch of executeTableScanBatches<Table>(
      async function* (signal, onByteLength) {
        yield await source.loadTable(signal, onByteLength);
      },
      options,
      {
        async filter(batch, predicate, signal) {
          if (!predicate) {
            return batch;
          }
          const {filterArrowTable} = await import('@loaders.gl/core/scan/arrow-execution');
          return filterArrowTable(batch, predicate, {signal});
        }
      }
    )) {
      if (batch.batches.length) yield* batch.batches;
      else yield makeArrowMetadataBatch(batch.schema);
    }
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
    const fetch = this.fetch;
    const {JSONTableLoaderWithParser} = await import('./json-table-loader');
    signal?.throwIfAborted();
    const input = typeof this.data === 'string' ? await fetch(this.url, {signal}) : this.data;
    if (input instanceof Response && !input.ok) {
      throw new Error(`JSON table source request failed with status ${input.status}`);
    }
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
