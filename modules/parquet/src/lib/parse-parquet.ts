// import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParquetLoaderOptions} from '../parquet-loader';

import {ParquetReader} from '../parquetjs/parser/parquet-reader';

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

export async function* parseParquetFileInBatches(
  blob: Blob,
  options?: ParquetLoaderOptions
): AsyncIterable<any[][]> {
  const reader = await ParquetReader.openBlob(blob);
  const rows: any[][] = [];
  try {
    const cursor = reader.getCursor();
    let record: any[] | null;
    while ((record = await cursor.next())) {
      rows.push(record);
    }
  } finally {
    await reader.close();
  }
  yield rows;
}
