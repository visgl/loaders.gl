// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  DataSourceOptions,
  ScanQueryMetadata,
  ScanQueryMetadataOptions
} from '@loaders.gl/loader-utils';
import {createScanQueryMetadata, DataSource, type ScanColumnRole} from '@loaders.gl/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {
  ARROW_TABLE_QUERY_CAPABILITIES,
  explainArrowTableQuery,
  queryArrowTable
} from './query-arrow-table';
import type {ArrowQueryOptions} from './query-arrow-table';
import type {TableQueryExplain} from './table-query';

/** In-memory source options; the source owns the supplied Arrow table. */
export type ArrowTableSourceOptions = DataSourceOptions;

/**
 * Query source for an in-memory Arrow or GeoArrow table.
 *
 * This is the reference source for the shared scan panel: metadata discovery is synchronous in
 * practice, and query execution delegates to the existing Arrow executor without ingesting data
 * into DuckDB or another intermediate representation.
 */
export class ArrowTableSource extends DataSource<ArrowTable, ArrowTableSourceOptions> {
  /** Creates a source over an existing Arrow table without copying its vectors. */
  constructor(data: ArrowTable, options: ArrowTableSourceOptions = {}) {
    super(data, options);
  }

  /** Discovers query-visible fields and capabilities without evaluating any rows. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    throwIfAborted(options.signal);
    const schema = convertArrowToSchema(this.data.data.schema);
    return createScanQueryMetadata({
      sourceType: 'arrow-table',
      queryType: 'table',
      schema,
      capabilities: {table: ARROW_TABLE_QUERY_CAPABILITIES},
      columnRoles: getArrowColumnRoles(schema.fields.map(field => field.name)),
      statistics: {rowCount: this.data.data.numRows}
    });
  }

  /** Executes a portable query and returns an Arrow table result. */
  query(options: ArrowQueryOptions = {}): ArrowTable {
    return queryArrowTable(this.data, options);
  }

  /** Explains a portable query without evaluating table rows. */
  explain(options: ArrowQueryOptions = {}): TableQueryExplain {
    return explainArrowTableQuery(this.data, options);
  }

  /** Executes a query as one bounded Arrow batch. */
  async *read(options: ArrowQueryOptions = {}): AsyncIterableIterator<ArrowTableBatch> {
    const result = this.query(options);
    yield {
      batchType: 'data',
      shape: 'arrow-table',
      schema: result.schema,
      data: result.data,
      length: result.data.numRows
    };
  }
}

/** Returns conventional semantic roles for common Arrow coordinate and time names. */
function getArrowColumnRoles(
  columnNames: readonly string[]
): Readonly<Record<string, ScanColumnRole>> {
  const roles: Record<string, ScanColumnRole> = {};
  for (const columnName of columnNames) {
    const normalizedName = columnName.toLowerCase();
    if (normalizedName === 'x' || normalizedName === 'longitude' || normalizedName === 'lon') {
      roles[columnName] = normalizedName === 'x' ? 'x' : 'longitude';
    } else if (
      normalizedName === 'y' ||
      normalizedName === 'latitude' ||
      normalizedName === 'lat'
    ) {
      roles[columnName] = normalizedName === 'y' ? 'y' : 'latitude';
    } else if (
      normalizedName === 'z' ||
      normalizedName === 'elevation' ||
      normalizedName === 'altitude'
    ) {
      roles[columnName] = normalizedName === 'z' ? 'z' : 'attribute';
    } else if (
      normalizedName === 'time' ||
      normalizedName.endsWith('_time') ||
      normalizedName.endsWith('timestamp')
    ) {
      roles[columnName] = 'time';
    }
  }
  return roles;
}

/** Throws the common source cancellation error before metadata or execution work begins. */
function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }
}
