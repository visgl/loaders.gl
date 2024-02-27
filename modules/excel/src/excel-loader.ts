// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/schema';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ExcelLoaderOptions = LoaderOptions & {
  excel?: {
    shape?: /* 'array-row-table' | */ 'object-row-table';
    sheet?: string; // Load default Sheet
  };
};

/**
 * Worker Loader for Excel files
 */
export const ExcelLoader = {
  dataType: null as unknown as ObjectRowTable,
  batchType: null as never,
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
  options: {
    excel: {
      shape: 'object-row-table',
      sheet: undefined // Load default Sheet
    }
  }
} as const satisfies Loader<ObjectRowTable, never, ExcelLoaderOptions>;
