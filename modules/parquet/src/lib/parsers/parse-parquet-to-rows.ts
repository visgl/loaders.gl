// import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
// import {ColumnarTableBatch} from '@loaders.gl/schema';
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
import type {ParquetRow} from '../../parquetjs/schema/declare';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {getSchemaFromParquetReader} from './get-parquet-schema';
import {installBufferPolyfill} from '../../polyfills/buffer';

export async function parseParquetFile(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable | GeoJSONTable> {
  installBufferPolyfill();

  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary
  });

  const schema = await getSchemaFromParquetReader(reader);

  const rows: ParquetRow[] = [];

  const rowBatches = reader.rowBatchIterator(options?.parquet);
  for await (const rowBatch of rowBatches) {
    // we have only one input batch so return
    for (const row of rowBatch) {
      rows.push(row);
    }
  }
  const objectRowTable: ObjectRowTable = {
    shape: 'object-row-table',
    schema,
    data: rows
  };

  const shape = options?.parquet?.shape;
  return convertTable(objectRowTable, shape);
}

export async function* parseParquetFileInBatches(
  file: ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch | GeoJSONTableBatch> {
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
    const shape = options?.parquet?.shape;
    const table = convertTable(objectRowTable, shape);

    yield {
      batchType: 'data',
      schema,
      ...table,
      length: rows.length
    };
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
