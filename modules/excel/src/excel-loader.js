/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

import {parseExcel} from './lib/parse-excel';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const ExcelLoaderOptions = {
  excel: {}
};

/**
 * Loader for Excel files
 * @type {LoaderObject}
 */
export const ExcelLoader = {
  id: 'excel',
  name: 'Excel',
  version: VERSION,
  extensions: ['xls', 'xlsb', 'xlsm', 'xlsx'],
  mimeTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ],
  category: 'table',
  binary: true,
  parse,
  options: ExcelLoaderOptions
};

async function parse(arrayBuffer, options, context) {
  return parseExcel(arrayBuffer, options, context);
}
