// import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
// import {ColumnarTableBatch} from '@loaders.gl/schema';
import {makeReadableFile} from '@loaders.gl/loader-utils';
import type {ParquetLoaderOptions} from '../../parquet-loader';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';

export async function parseParquet(
  arrayBuffer: ArrayBuffer,
  options?: ParquetLoaderOptions
): Promise<any[][]> {
  const blob = new Blob([arrayBuffer]);
  for await (const batch of parseParquetFileInBatches(blob, options)) {
    // we have only one input batch so return
    return batch;
  }
  return [];
}

export async function* parseParquetFileInBatches(blob: Blob, options?: ParquetLoaderOptions) {
  const file = makeReadableFile(blob);
  const reader = new ParquetReader(file);
  const rowBatches = reader.rowBatchIterator(options?.parquet);
  for await (const rows of rowBatches) {
    yield rows;
  }
}

// export async function* parseParquetFileInColumnarBatches(blob: Blob, options?: {columnList?: string[][]}): AsyncIterable<ColumnarTableBatch> {
//   const rowGroupReader = new ParquetRowGroupReader({data: blob, columnList: options?.columnList});
//   try {
//     for await (const rowGroup of rowGroupReader) {
//       yield convertRowGroupToTableBatch(rowGroup);
//     }
//   } finally {
//     await rowGroupReader.close();
//   }
// }

// function convertRowGroupToTableBatch(rowGroup): ColumnarTableBatch {
//   // @ts-expect-error
//   return {
//     data: rowGroup
//   };
// }
