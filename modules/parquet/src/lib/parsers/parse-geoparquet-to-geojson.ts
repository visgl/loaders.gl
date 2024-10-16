// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {
  GeoJSONTable,
  GeoJSONTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';
import {convertGeoTable, convertGeoBatch} from '@loaders.gl/gis';

import type {ParquetJSONLoaderOptions} from '../../parquet-json-loader';

import {parseParquetFile, parseParquetFileInBatches} from './parse-parquet-to-json';

export async function parseGeoParquetFile(
  file: ReadableFile,
  options?: ParquetJSONLoaderOptions
): Promise<ObjectRowTable | GeoJSONTable> {
  const table = await parseParquetFile(file, {...options, shape: 'object-row-table'});
  const shape = options?.parquet?.shape;
  return convertGeoTable(table, shape);
}

export async function* parseGeoParquetFileInBatches(
  file: ReadableFile,
  options?: ParquetJSONLoaderOptions
): AsyncIterable<ObjectRowTableBatch | GeoJSONTableBatch> {
  const tableBatches = parseParquetFileInBatches(file, {...options, shape: 'object-row-table'});

  for await (const batch of tableBatches) {
    const shape = options?.parquet?.shape;
    yield convertGeoBatch(batch, shape);
  }
}
