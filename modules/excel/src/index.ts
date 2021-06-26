import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {ExcelLoader as ExcelWorkerLoader, ExcelLoaderOptions} from './excel-loader';
import {parseExcel} from './lib/parse-excel';

// Excel Loader

export type {ExcelLoaderOptions};
export {ExcelWorkerLoader};

/**
 * Loader for Excel files
 */
export const ExcelLoader = {
  ...ExcelWorkerLoader,
  parse: (arrayBuffer: ArrayBuffer, options?: ExcelLoaderOptions) =>
    parseExcel(arrayBuffer, options)
};

export const _typecheckLoader: LoaderWithParser = ExcelLoader;
