// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {default as log} from '@probe.gl/log';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ObjectRowTable, ObjectRowTableBatch, Schema} from '@loaders.gl/schema';

import type {ParquetLoaderOptions} from '../../parquet-loader-options';
import type {ParquetRow} from '../../parquetjs/schema/declare';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {getSchemaFromParquetReader} from './get-parquet-schema';
import {preloadCompressions} from '../../parquetjs/compression';

/**
 *  * Parse a parquet file using parquetjs
 * @param file
 * @param options
 * @returns
 */
export async function parseParquetFile(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable> {
  await preloadCompressions(options);

  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary
  });

  const schema = await getSchemaFromParquetReader(reader);
  const projectedSchema = projectSchema(schema, options?.parquet?.columns);

  const rows: ParquetRow[] = [];

  const rowBatches = reader.rowBatchIterator(getParquetIterationProps(options));
  const rowOffset = options?.parquet?.offset || 0;
  const rowLimit = options?.parquet?.limit;
  let rowsSkipped = 0;
  for await (const rowBatch of rowBatches) {
    for (const row of rowBatch) {
      if (rowsSkipped < rowOffset) {
        rowsSkipped++;
        continue;
      }

      if (rowLimit !== undefined && rows.length >= rowLimit) {
        log.warn(`Rows number limit has been reached. Only first ${rowLimit} are loaded`)();
        return {
          shape: 'object-row-table',
          schema: projectedSchema,
          data: rows
        };
      }

      rows.push(row);
    }
  }

  const objectRowTable: ObjectRowTable = {
    shape: 'object-row-table',
    schema: projectedSchema,
    data: rows
  };

  return objectRowTable;
}

/**
 * Parse a parquet file in batches using parquetjs
 * @param file
 * @param options
 */
export async function* parseParquetFileInBatches(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch> {
  await preloadCompressions(options);

  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary
  });

  const schema = await getSchemaFromParquetReader(reader);
  const projectedSchema = projectSchema(schema, options?.parquet?.columns);
  const rowBatches = reader.rowBatchIterator(getParquetIterationProps(options));
  const rowOffset = options?.parquet?.offset || 0;
  const rowLimit = options?.parquet?.limit;
  const outputBatchSize = options?.parquet?.batchSize;
  let rowsSkipped = 0;
  let rowsYielded = 0;
  let reachedLimit = false;

  for await (const rows of rowBatches) {
    const nextRows: ParquetRow[] = [];
    for (const row of rows) {
      if (rowsSkipped < rowOffset) {
        rowsSkipped++;
        continue;
      }

      if (rowLimit !== undefined && rowsYielded >= rowLimit) {
        reachedLimit = true;
        break;
      }

      nextRows.push(row);
      rowsYielded++;
    }

    if (nextRows.length === 0) {
      continue;
    }

    if (!outputBatchSize || outputBatchSize <= 0) {
      yield makeObjectRowBatch(projectedSchema, nextRows);
      continue;
    }

    for (let rowIndex = 0; rowIndex < nextRows.length; rowIndex += outputBatchSize) {
      yield makeObjectRowBatch(
        projectedSchema,
        nextRows.slice(rowIndex, rowIndex + outputBatchSize)
      );
    }

    if (reachedLimit) {
      return;
    }
  }
}

function getParquetIterationProps(
  options?: ParquetLoaderOptions
): {columnList?: string[] | string[][]} | undefined {
  const columnList = options?.parquet?.columns;
  return columnList?.length ? {columnList} : undefined;
}

function makeObjectRowBatch(schema: Schema, rows: ParquetRow[]): ObjectRowTableBatch {
  const objectRowTable: ObjectRowTable = {
    shape: 'object-row-table',
    schema,
    data: rows
  };

  return {
    batchType: 'data',
    schema,
    ...objectRowTable,
    length: rows.length
  };
}

function projectSchema(schema: Schema, columns?: string[]): Schema {
  if (!columns?.length) {
    return schema;
  }

  return {
    ...schema,
    fields: schema.fields.filter(field => columns.includes(field.name))
  };
}
