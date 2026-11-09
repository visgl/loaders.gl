// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, ObjectRowTableBatch} from '@loaders.gl/core/schema';
import type {
  DataSource,
  DataSourceOptions,
  TableReference,
  TableScanSource
} from '@loaders.gl/core/loader-utils';
import {createScanQueryMetadata} from '@loaders.gl/core/loader-utils';
import {convertSchemaToArrow} from '@loaders.gl/core/schema-utils';
import {createSQLCatalog, type SQLCatalogQuery} from './sql-catalog';

/** Turns a logical metadata command into an ordinary schema-bearing table source. */
export function createCatalogQuerySource(
  request: SQLCatalogQuery,
  sources: readonly DataSource<unknown, DataSourceOptions>[] | undefined
): TableScanSource<ObjectRowTableBatch> {
  const allowed = request.command === 'showSources' ? ['command'] : ['command', 'from'];
  if (
    !['showSources', 'showTables', 'describe'].includes(request.command) ||
    Object.keys(request).some(key => !allowed.includes(key))
  )
    throw new Error('Unsupported catalog query.');
  if (
    request.command === 'showTables' &&
    request.from !== undefined &&
    (typeof request.from !== 'string' || !request.from.trim())
  )
    throw new Error('SHOW TABLES requires a non-empty source name.');
  if (request.command === 'describe' && request.from === undefined)
    throw new Error('DESCRIBE requires a table reference.');
  const catalog = createSQLCatalog(sources!);
  const fields =
    request.command === 'showSources'
      ? ['source_name']
      : request.command === 'showTables'
        ? ['source_name', 'table_name', 'table_reference', 'queryable']
        : [
            'source_name',
            'table_name',
            'column_name',
            'ordinal_position',
            'data_type',
            'is_nullable',
            'metadata'
          ];
  const schema: Schema = {
    fields: fields.map(name => ({
      name,
      type:
        name === 'ordinal_position'
          ? 'int32'
          : name === 'queryable' || name === 'is_nullable'
            ? 'bool'
            : 'utf8',
      nullable: false
    })),
    metadata: {catalog: request.command}
  };
  return {
    async getQueryMetadata(options = {}) {
      options.signal?.throwIfAborted();
      return createScanQueryMetadata({
        sourceType: 'catalog',
        queryType: 'table',
        schema,
        execution: {status: 'supported', method: 'read'},
        capabilities: {
          table: {
            projection: 'unsupported',
            predicate: 'unsupported',
            limit: 'unsupported',
            streaming: true,
            cancellation: true
          }
        }
      });
    },
    async *read(options = {}) {
      const metadataOptions = {signal: options.signal};
      options.signal?.throwIfAborted();
      if (request.command === 'showSources') {
        const data = catalog.getSources().map(source => ({source_name: source.name}));
        if (data.length)
          yield {shape: 'object-row-table', schema, data, length: data.length, batchType: 'data'};
      } else if (request.command === 'showTables') {
        const names =
          request.from === undefined
            ? catalog.getSources().map(source => source.name)
            : [request.from];
        for (const name of names) {
          const tables = await catalog.getTables(name, metadataOptions);
          const data = tables.map(table => ({
            source_name: table.sourceName,
            table_name: table.name,
            table_reference: formatReference(table.reference),
            queryable: table.queryable
          }));
          if (data.length)
            yield {shape: 'object-row-table', schema, data, length: data.length, batchType: 'data'};
        }
      } else {
        const tableSchema = await catalog.getSchema(request.from, metadataOptions);
        const arrowSchema = convertSchemaToArrow(tableSchema);
        const sourceName = typeof request.from === 'string' ? request.from : request.from.source;
        const tableName = typeof request.from === 'string' ? request.from : request.from.table;
        const data = tableSchema.fields.map((field, index) => ({
          source_name: sourceName,
          table_name: tableName,
          column_name: field.name,
          ordinal_position: index + 1,
          data_type: arrowSchema.fields[index].type.toString(),
          is_nullable: arrowSchema.fields[index].nullable,
          metadata: JSON.stringify(field.metadata || {})
        }));
        if (data.length)
          yield {shape: 'object-row-table', schema, data, length: data.length, batchType: 'data'};
      }
    }
  };
}

/** Renders actual references as safely quoted SQL for schema explorers. */
function formatReference(reference: TableReference): string {
  const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;
  return typeof reference === 'string'
    ? quote(reference)
    : `${quote(reference.source)}.${quote(reference.table)}`;
}
