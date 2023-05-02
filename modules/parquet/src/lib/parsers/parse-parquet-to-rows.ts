// import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
// import {ColumnarTableBatch} from '@loaders.gl/schema';
import {makeReadableFile} from '@loaders.gl/loader-utils';
import {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';
import type {ParquetLoaderOptions} from '../../parquet-loader';
import type {ParquetRow} from '../../parquetjs/schema/declare';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';

export async function parseParquet(
  arrayBuffer: ArrayBuffer,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable> {
  const blob = new Blob([arrayBuffer]);

  const rows: ParquetRow[] = [];
  for await (const batch of parseParquetFileInBatches(blob, options)) {
    // we have only one input batch so return
    for (const row of batch.data) {
      rows.push(row);
    }
  }

  return {
    shape: 'object-row-table',
    // TODO - spread can fail for very large number of batches
    data: rows
  };
}

export async function* parseParquetFileInBatches(
  blob: Blob,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch> {
  const file = makeReadableFile(blob);
  const reader = new ParquetReader(file);
  const rowBatches = reader.rowBatchIterator(options?.parquet);
  for await (const rows of rowBatches) {
    yield {
      shape: 'object-row-table',
      data: rows,
      batchType: 'data',
      length: rows.length
    };
  }
}
