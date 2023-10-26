// import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
// import {ColumnarTableBatch} from '@loaders.gl/schema';
import {BlobFile} from '@loaders.gl/loader-utils';
import {GeoJSONTable, ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';
import {convertWKBTableToGeoJSON} from '@loaders.gl/gis';
import {WKTLoader, WKBLoader} from '@loaders.gl/wkt';

import type {ParquetLoaderOptions} from '../../parquet-loader';
import type {ParquetRow} from '../../parquetjs/schema/declare';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import {getSchemaFromParquetReader} from './get-parquet-schema';
import {installBufferPolyfill} from '../../buffer-polyfill';

export async function parseParquet(
  arrayBuffer: ArrayBuffer,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable | GeoJSONTable> {
  installBufferPolyfill();

  const blob = new Blob([arrayBuffer]);
  const file = new BlobFile(blob);
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
  switch (shape) {
    case 'object-row-table':
      return objectRowTable;

    case 'geojson-table':
      try {
        return convertWKBTableToGeoJSON(objectRowTable, schema, [WKTLoader, WKBLoader]);
      } catch (error) {
        return objectRowTable;
      }

    default:
      throw new Error(shape);
  }
}

export async function* parseParquetFileInBatches(
  reader: ParquetReader,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch> {
  const schema = await getSchemaFromParquetReader(reader);
  const rowBatches = reader.rowBatchIterator(options?.parquet);
  for await (const rows of rowBatches) {
    yield {
      batchType: 'data',
      shape: 'object-row-table',
      schema,
      data: rows,
      length: rows.length
    };
  }
}
