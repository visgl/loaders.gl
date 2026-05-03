// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';
import {parseExcel} from './lib/parse-excel';
import {convertExcelRowsToArrowTable} from './lib/convert-excel-rows-to-arrow';
import {ExcelWorkerLoader as ExcelWorkerLoaderMetadata} from './excel-loader';
import {ExcelLoader as ExcelLoaderMetadata} from './excel-loader';

const {preload: _ExcelWorkerLoaderPreload, ...ExcelWorkerLoaderMetadataWithoutPreload} =
  ExcelWorkerLoaderMetadata;
const {preload: _ExcelLoaderPreload, ...ExcelLoaderMetadataWithoutPreload} = ExcelLoaderMetadata;

/** Options for parsing Excel worksheets. */
export type ExcelLoaderOptions = LoaderOptions & {
  /** Options for ExcelLoaderWithParser */
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
export const ExcelWorkerLoaderWithParser = {
  ...ExcelWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<ObjectRowTable | ArrowTable, never, ExcelLoaderOptions>;

/** Loader for Excel files. */
export const ExcelLoaderWithParser = {
  ...ExcelLoaderMetadataWithoutPreload,
  async parse(
    arrayBuffer: ArrayBuffer,
    options?: ExcelLoaderOptions
  ): Promise<ObjectRowTable | ArrowTable> {
    const excelOptions = {
      ...options,
      excel: {...ExcelLoaderWithParser.options.excel, ...options?.excel}
    } as ExcelLoaderOptions;
    const rows = parseExcel(arrayBuffer, excelOptions);
    if (excelOptions.excel?.shape === 'arrow-table') {
      return convertExcelRowsToArrowTable(rows);
    }
    return {shape: 'object-row-table', data: rows};
  }
} as const satisfies LoaderWithParser<ObjectRowTable | ArrowTable, never, ExcelLoaderOptions>;
