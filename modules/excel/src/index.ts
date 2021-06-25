import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {ExcelLoader as ExcelWorkerLoader} from './excel-loader';
import {parseExcel} from './lib/parse-excel';

// Excel Loader

export type {ExcelLoaderOptions} from './excel-loader';

export {ExcelWorkerLoader};

/**
 * Loader for Excel files
 */
export const ExcelLoader = {
  ...ExcelWorkerLoader,
  parse: (arrayBuffer, options, context) => parseExcel(arrayBuffer, options, context)
};
