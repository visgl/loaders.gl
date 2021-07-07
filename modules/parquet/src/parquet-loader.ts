import type {LoaderWithParser, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {ParquetReader} from './parquetjs/reader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ParquetLoaderOptions = LoaderOptions & {
  parquet?: {
    type?: 'object-row-table';
    url?: string;
  };
};

const DEFAULT_PARQUET_LOADER_OPTIONS: ParquetLoaderOptions = {
  parquet: {
    type: 'object-row-table',
    url: undefined
  }
};

/** ParquetJS table loader */
export const ParquetWorkerLoader: Loader = {
  name: 'Apache Parquet',
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: true,
  category: 'table',
  extensions: ['parquet'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  // tests: ['PARQUET'],
  options: DEFAULT_PARQUET_LOADER_OPTIONS
};

/** ParquetJS table loader */
export const ParquetLoader: LoaderWithParser = {
  ...ParquetWorkerLoader,
  parse
};

async function parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
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
