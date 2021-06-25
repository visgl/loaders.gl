import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ExcelLoaderOptions = LoaderOptions & {
  excel?: {
    sheet?: string; // Load default Sheet
  };
};

const DEFAULT_EXCEL_LOADER_OPTIONS: ExcelLoaderOptions = {
  excel: {
    sheet: undefined // Load default Sheet
  }
};

/**
 * Worker Loader for Excel files
 */
export const ExcelLoader = {
  name: 'Excel',
  id: 'excel',
  module: 'excel',
  version: VERSION,
  worker: true,
  extensions: ['xls', 'xlsb', 'xlsm', 'xlsx'],
  mimeTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ],
  category: 'table',
  binary: true,
  options: DEFAULT_EXCEL_LOADER_OPTIONS
};

export const _typecheckLoader: Loader = ExcelLoader;
