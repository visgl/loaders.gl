// import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParquetLoaderOptions} from '../parquet-loader';

import {ParquetReader} from '../parquetjs/parser/parquet-reader';

export async function parseParquet(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
  const blob = new Blob([arrayBuffer]);
  for await (const batch of parseParquetFileInBatches(blob, options)) {
    return batch;
  }
  return null;
}

export async function* parseParquetFileInBatches(blob: Blob, options?: ParquetLoaderOptions) {
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
