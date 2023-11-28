// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {
  GeoJSONTable,
  GeoJSONTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {WKTLoader, WKBLoader} from '@loaders.gl/wkt';

import type {ParquetLoaderOptions} from '../../parquet-loader';

import {parseParquetFile, parseParquetFileInBatches} from './parse-parquet';

export async function parseGeoParquetFile(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable | GeoJSONTable> {
  const table = await parseParquetFile(file, options);
  const shape = options?.parquet?.shape;
  return convertTable(table, shape);
}

export async function* parseGeoParquetFileInBatches(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch | GeoJSONTableBatch> {
  const tableBatches = parseParquetFileInBatches(file, options);

  for await (const batch of tableBatches) {
    const shape = options?.parquet?.shape;
    yield convertBatch(batch, shape);
  }
}

function convertTable(
  objectRowTable: ObjectRowTable,
  shape?: 'object-row-table' | 'geojson-table'
): ObjectRowTable | GeoJSONTable {
  switch (shape) {
    case 'object-row-table':
      return objectRowTable;

    case 'geojson-table':
      try {
        return convertWKBTableToGeoJSON(objectRowTable, objectRowTable.schema!, [
          WKTLoader,
          WKBLoader
        ]);
      } catch (error) {
        return objectRowTable;
      }

    default:
      throw new Error(shape);
  }
}

function convertBatch(
  objectRowBatch: ObjectRowTableBatch,
  shape?: 'object-row-table' | 'geojson-table'
): ObjectRowTableBatch | GeoJSONTableBatch {
  switch (shape) {
    case 'object-row-table':
      return objectRowBatch;

    case 'geojson-table':
      try {
        const geojsonTable = convertWKBTableToGeoJSON(objectRowBatch, objectRowBatch.schema!, [
          WKTLoader,
          WKBLoader
        ]);
        return {
          ...objectRowBatch,
          ...geojsonTable
        };
      } catch (error) {
        return objectRowBatch;
      }

    default:
      throw new Error(shape);
  }
}
