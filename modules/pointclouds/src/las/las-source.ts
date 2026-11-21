// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, type RecordBatch} from 'apache-arrow';
import {
  DataSource,
  createScanQueryMetadata,
  executeTableScanBatches,
  explainTableQuery,
  getColumnarPredicateColumns,
  type CoreAPI,
  type DataSourceOptions,
  type ScanQueryMetadata,
  type TableScanReadOptions,
  type TableScanSource
} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema, makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import {LASLoaderWithParser, parseLASMetadata} from './las-loader';
import type {LASColumnName, LASLoaderOptions} from './las-loader-shared';

/** LAS decoding options shared by metadata discovery and streaming scans. */
export type LASSourceOptions = LASLoaderOptions & DataSourceOptions;

/** Physical operations supported by the sequential LAS/LAZ decoder. */
const LAS_QUERY_CAPABILITIES = Object.freeze({
  predicate: 'residual',
  projection: 'pushdown+residual',
  limit: 'pushdown',
  offset: 'pushdown',
  cast: 'unsupported',
  streaming: true,
  cancellation: true
} as const);

/** Streams LAS or LAZ point records with decoder-level column selection. */
export class LASSource
  extends DataSource<string | Blob, LASSourceOptions>
  implements TableScanSource<RecordBatch>
{
  /** Creates a source without fetching or decoding point data. */
  constructor(data: string | Blob, options: LASSourceOptions = {}, coreApi?: CoreAPI) {
    super(data, options, undefined, coreApi);
  }

  /** Discovers fields from the header and variable-length records without decoding points. */
  async getQueryMetadata(options: TableScanReadOptions = {}): Promise<ScanQueryMetadata> {
    const chunks: Uint8Array[] = [];
    let length = 0;
    let required = 227;
    for await (const chunk of this.readBytes(options.signal)) {
      chunks.push(chunk);
      length += chunk.byteLength;
      if (length < required) continue;
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const part of chunks) {
        bytes.set(part, offset);
        offset += part.byteLength;
      }
      const view = new DataView(bytes.buffer);
      if (view.getUint32(0, true) !== 0x4653414c) throw new Error('Invalid LAS header');
      required = Math.max(227, view.getUint16(94, true), view.getUint32(96, true));
      if (length < required) continue;
      const table = parseLASMetadata(bytes.buffer.slice(0, required), this.loadOptions);
      return createScanQueryMetadata({
        sourceType: 'las',
        name: this.name,
        queryType: 'table',
        execution: {status: 'supported', method: 'read'},
        schema: convertArrowToSchema(table.schema),
        capabilities: {table: LAS_QUERY_CAPABILITIES}
      });
    }
    throw new Error('Truncated LAS header');
  }

  /** Explains projection and row-window pushdown separately from residual filtering. */
  async explain(options: TableScanReadOptions = {}) {
    const metadata = await this.getQueryMetadata(options);
    return explainTableQuery(
      metadata.columns.map(column => column.name),
      options,
      LAS_QUERY_CAPABILITIES
    );
  }

  /** Decodes selected columns and applies predicates before the global offset and limit. */
  async *read(options: TableScanReadOptions = {}): AsyncIterable<RecordBatch> {
    const columns =
      options.columns === undefined
        ? undefined
        : [
            ...new Set([
              ...options.columns,
              ...(options.predicate ? getColumnarPredicateColumns(options.predicate) : [])
            ])
          ];
    for await (const table of executeTableScanBatches<Table>(
      (signal, onByteLength) => this.parseBatches(columns, signal, onByteLength),
      options,
      {
        async filter(batch, predicate, signal) {
          if (!predicate) return batch;
          const {filterArrowTable} = await import('@loaders.gl/core/query/arrow-execution');
          return filterArrowTable(batch, predicate, {signal});
        }
      }
    )) {
      if (table.batches.length) yield* table.batches;
      else yield makeArrowMetadataBatch(table.schema);
    }
  }

  /** Pushes selected source fields into the decoder before allocating Arrow columns. */
  private async *parseBatches(
    columns?: readonly string[],
    signal?: AbortSignal,
    onByteLength?: (bytes: number) => void
  ): AsyncIterable<Table> {
    const options: LASLoaderOptions = {
      ...this.loadOptions,
      signal,
      las: {
        ...this.options.las,
        shape: 'arrow',
        ...(columns && {
          columns: [
            ...new Set(
              columns.map(column =>
                this.options.las?.extraBytes === 'typed' && column.startsWith('EXTRA_BYTES_')
                  ? 'EXTRA_BYTES'
                  : column
              )
            )
          ] as LASColumnName[]
        })
      }
    };
    const chunks = this.readBytes(signal, onByteLength);
    try {
      for await (const batch of LASLoaderWithParser.parseInBatches(chunks, options)) {
        if ('attributes' in batch) throw new Error('Expected Arrow LAS output');
        yield new Table(batch.schema, [batch]);
      }
    } finally {
      // The decoder advances its input manually; the source owns closing that input.
      await chunks.return();
    }
  }

  /** Reads with cancellation and closes the stream when a limit stops decoding early. */
  private async *readBytes(
    signal?: AbortSignal,
    onByteLength?: (bytes: number) => void
  ): AsyncGenerator<Uint8Array, void> {
    signal?.throwIfAborted();
    const input = this.data instanceof Blob ? this.data : await this.fetch(this.url, {signal});
    if (input instanceof Response && !input.ok)
      throw new Error(`LAS request failed: ${input.status}`);
    const stream = input instanceof Blob ? input.stream() : input.body;
    if (!stream) {
      const bytes = new Uint8Array(await input.arrayBuffer());
      signal?.throwIfAborted();
      onByteLength?.(bytes.byteLength);
      yield bytes;
      return;
    }
    const reader = stream.getReader();
    const abort = () => {
      void reader.cancel().catch(() => {});
    };
    signal?.addEventListener('abort', abort, {once: true});
    try {
      while (true) {
        signal?.throwIfAborted();
        const {done, value} = await reader.read();
        signal?.throwIfAborted();
        if (done) return;
        onByteLength?.(value.byteLength);
        yield value;
      }
    } finally {
      signal?.removeEventListener('abort', abort);
      await reader.cancel();
      reader.releaseLock();
    }
  }
}
