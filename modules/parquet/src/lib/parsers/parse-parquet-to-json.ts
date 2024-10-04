// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {default as log} from '@probe.gl/log';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';

import type {ParquetJSONLoaderOptions} from '../../parquet-json-loader';
import type {ParquetRow} from '../../parquetjs/schema/declare';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {getSchemaFromParquetReader} from './get-parquet-schema';
import {installBufferPolyfill} from '../../polyfills/buffer/index';
import {preloadCompressions} from '../../parquetjs/compression';

/**
 *  * Parse a parquet file using parquetjs
 * @param file
 * @param options
 * @returns
 */
export async function parseParquetFile(
  file: ReadableFile,
  options?: ParquetJSONLoaderOptions
): Promise<ObjectRowTable> {
  installBufferPolyfill();
  await preloadCompressions(options);

  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary
  });

  const schema = await getSchemaFromParquetReader(reader);

  const rows: ParquetRow[] = [];

  const rowBatches = reader.rowBatchIterator(options?.parquet);
  for await (const rowBatch of rowBatches) {
    let limitHasReached = false;
    // we have only one input batch so return
    for (const row of rowBatch) {
      if (options?.limit && rows.length >= options?.limit) {
        limitHasReached = true;
        break;
      }
      rows.push(row);
    }
    if (limitHasReached) {
      log.warn(`Rows number limit has been reached. Only first ${options?.limit} are loaded`)();
      break;
    }
  }
  const objectRowTable: ObjectRowTable = {
    shape: 'object-row-table',
    schema,
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
  options?: ParquetJSONLoaderOptions
): AsyncIterable<ObjectRowTableBatch> {
  installBufferPolyfill();
  await preloadCompressions(options);

  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary
  });

  const schema = await getSchemaFromParquetReader(reader);
  const rowBatches = reader.rowBatchIterator(options?.parquet);
  for await (const rows of rowBatches) {
    const objectRowTable: ObjectRowTable = {
      shape: 'object-row-table',
      schema,
      data: rows
    };

    yield {
      batchType: 'data',
      schema,
      ...objectRowTable,
      length: rows.length
    };
  }
}
