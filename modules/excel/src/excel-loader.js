/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

import {parseExcel} from './lib/parse-excel';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const ExcelLoaderOptions = {
  excel: {
    sheet: null // Load default Sheet
  }
};

/**
 * Worker Loader for Excel files
 * @type {WorkerLoaderObject}
 */
export const ExcelWorkerLoader = {
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
  options: ExcelLoaderOptions
};

/**
 * Loader for Excel files
 * @type {LoaderObject}
 */
export const ExcelLoader = {
  ...ExcelWorkerLoader,
  parse: (arrayBuffer, options, context) => parseExcel(arrayBuffer, options, context)
};
