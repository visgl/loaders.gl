// import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParquetLoaderOptions} from '../parquet-loader';

import {ParquetReader} from '../parquetjs/classes/parquet-reader';

export async function parseParquet(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
  const reader = await ParquetReader.openArrayBuffer(arrayBuffer);
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
  return rows;
}

export async function* parseParquetFileInBatches(blob: Blob, options?: ParquetLoaderOptions) {
  const reader = await ParquetReader.openBlob(blob);
  try {
    const cursor = reader.getCursor();
    let record: any[] | null;
    while ((record = await cursor.next())) {
      yield record;
    }
  } finally {
    await reader.close();
  }
}
