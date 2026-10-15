// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';
import {
  deserializeArrowWorkerResult,
  serializeArrowWorkerResult
} from '@loaders.gl/arrow/transport';
import {parseExcel} from './lib/parse-excel';
import {convertExcelRowsToArrowTable} from './lib/convert-excel-rows-to-arrow';
import {ExcelWorkerLoader as ExcelWorkerLoaderMetadata} from './excel-loader-types';
import {ExcelLoader as ExcelLoaderMetadata} from './excel-loader-types';

import type {ExcelLoaderOptions} from './excel-loader-types';

const {preload: _ExcelWorkerLoaderPreload, ...ExcelWorkerLoaderMetadataWithoutPreload} =
  ExcelWorkerLoaderMetadata;
const {preload: _ExcelLoaderPreload, ...ExcelLoaderMetadataWithoutPreload} = ExcelLoaderMetadata;

export type {ExcelLoaderOptions} from './excel-loader-types';

/** Worker loader for Excel files. */
export const ExcelWorkerLoaderWithParser = {
  ...ExcelWorkerLoaderMetadataWithoutPreload,
  /** Serializes Arrow output for worker messages. */
  serializeWorkerResult: serializeArrowWorkerResult,
  /** Hydrates Arrow output returned by a worker. */
  deserializeWorkerResult: deserializeArrowWorkerResult
} as const satisfies Loader<ObjectRowTable | ArrowTable, never, ExcelLoaderOptions>;

/** Loader for Excel files. */
export const ExcelLoaderWithParser = {
  ...ExcelLoaderMetadataWithoutPreload,
  /** Serializes Arrow output for worker messages. */
  serializeWorkerResult: serializeArrowWorkerResult,
  /** Hydrates Arrow output returned by a worker. */
  deserializeWorkerResult: deserializeArrowWorkerResult,
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
