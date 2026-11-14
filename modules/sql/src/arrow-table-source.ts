// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RecordBatch, Table} from 'apache-arrow';
import {makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import type {
  DataSourceOptions,
  ScanQueryMetadata,
  ScanQueryMetadataOptions
} from '@loaders.gl/core/loader-utils';
import {
  createScanQueryMetadata,
  DataSource,
  type ScanColumnRole
} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {
  ARROW_TABLE_QUERY_CAPABILITIES,
  explainArrowTableQuery,
  queryArrowTable
} from '@loaders.gl/core/scan/query-arrow-table';
import type {ArrowQueryOptions} from '@loaders.gl/core/scan/query-arrow-table';
import type {TableQueryExplain} from '@loaders.gl/core/scan/table-query';

/** In-memory source options; the source owns the supplied Arrow table. */
export type ArrowTableSourceOptions = DataSourceOptions;

/**
 * Query source for an in-memory Arrow or GeoArrow table.
 *
 * This is the reference source for the shared scan panel: metadata discovery is synchronous in
 * practice, and query execution delegates to the existing Arrow executor without ingesting data
 * into DuckDB or another intermediate representation.
 */
export class ArrowTableSource extends DataSource<Table, ArrowTableSourceOptions> {
  /** Creates a source over an existing Arrow table without copying its vectors. */
  constructor(data: Table, options: ArrowTableSourceOptions = {}) {
    super(data, options);
  }

  /** Discovers query-visible fields and capabilities without evaluating any rows. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    throwIfAborted(options.signal);
    const schema = convertArrowToSchema(this.data.schema);
    return createScanQueryMetadata({
      sourceType: 'arrow-table',
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      schema,
      capabilities: {table: ARROW_TABLE_QUERY_CAPABILITIES},
      columnRoles: getArrowColumnRoles(schema.fields.map(field => field.name)),
      statistics: {rowCount: this.data.numRows}
    });
  }

  /** Executes a portable query and returns an Arrow table result. */
  query(options: ArrowQueryOptions = {}): Table {
    return queryArrowTable(this.data, options);
  }

  /** Explains a portable query without evaluating table rows. */
  explain(options: ArrowQueryOptions = {}): TableQueryExplain {
    return explainArrowTableQuery(this.data, options);
  }

  /** Executes a query as one bounded Arrow batch. */
  async *read(options: ArrowQueryOptions = {}): AsyncIterableIterator<RecordBatch> {
    const data = this.query(options);
    if (data.batches.length) yield* data.batches;
    else yield makeArrowMetadataBatch(data.schema);
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
