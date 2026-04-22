// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';
import {parseExcel} from './lib/parse-excel';
import {convertExcelRowsToArrowTable} from './lib/convert-excel-rows-to-arrow';
import {ExcelFormat} from './excel-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for parsing Excel worksheets. */
export type ExcelLoaderOptions = LoaderOptions & {
  /** Options for ExcelLoader */
  excel?: {
    /** Selects row-table output or Apache Arrow output. */
    shape?: /* 'array-row-table' | */ 'object-row-table' | 'arrow-table';
    /** Specify which sheet to load, if omitted loads default sheet. */
    sheet?: string;
    /** Override the URL to the worker bundle (by default loads from unpkg.com). */
    workerUrl?: string;
  };
};

/** Worker loader for Excel files. */
export const ExcelWorkerLoader = {
  ...ExcelFormat,
  dataType: null as unknown as ObjectRowTable | ArrowTable,
  batchType: null as never,
  version: VERSION,
  worker: true,
  options: {
    excel: {
      shape: 'object-row-table',
      sheet: undefined // Load default Sheet
    }
  }
} as const satisfies Loader<ObjectRowTable | ArrowTable, never, ExcelLoaderOptions>;

/** Loader for Excel files. */
export const ExcelLoader = {
  ...ExcelWorkerLoader,
  async parse(
    arrayBuffer: ArrayBuffer,
    options?: ExcelLoaderOptions
  ): Promise<ObjectRowTable | ArrowTable> {
    const excelOptions = {
      ...options,
      excel: {...ExcelLoader.options.excel, ...options?.excel}
    } as ExcelLoaderOptions;
    const rows = parseExcel(arrayBuffer, excelOptions);
    if (excelOptions.excel?.shape === 'arrow-table') {
      return convertExcelRowsToArrowTable(rows);
    }
    return {shape: 'object-row-table', data: rows};
  }
} as const satisfies LoaderWithParser<ObjectRowTable | ArrowTable, never, ExcelLoaderOptions>;
