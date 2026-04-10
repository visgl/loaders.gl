// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {parseExcel} from './lib/parse-excel';
import {ExcelFormat} from './excel-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ExcelLoaderOptions = LoaderOptions & {
  /** Options for ExcelLoader */
  excel?: {
    /** Format of returned data */
    shape?: /* 'array-row-table' | */ 'object-row-table';
    /** Specify which sheet to load, if omitted loads default sheet */
    sheet?: string;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker Loader for Excel files
 */
export const ExcelWorkerLoader = {
  ...ExcelFormat,
  dataType: null as unknown as ObjectRowTable,
  batchType: null as never,
  version: VERSION,
  worker: true,
  options: {
    excel: {
      shape: 'object-row-table',
      sheet: undefined // Load default Sheet
    }
  }
} as const satisfies Loader<ObjectRowTable, never, ExcelLoaderOptions>;

/**
 * Loader for Excel files
 */
export const ExcelLoader = {
  ...ExcelWorkerLoader,
  async parse(arrayBuffer: ArrayBuffer, options?: ExcelLoaderOptions): Promise<ObjectRowTable> {
    const data = parseExcel(arrayBuffer, options);
    return {shape: 'object-row-table', data};
  }
} as const satisfies LoaderWithParser<ObjectRowTable, never, ExcelLoaderOptions>;
