// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/schema';
import type {ExcelLoaderOptions} from './excel-loader';
import {ExcelLoader as ExcelWorkerLoader} from './excel-loader';
import {parseExcel} from './lib/parse-excel';

// Excel Loader

export type {ExcelLoaderOptions};
export {ExcelWorkerLoader};

/**
 * Loader for Excel files
 */
export const ExcelLoader: LoaderWithParser<ObjectRowTable, never, ExcelLoaderOptions> = {
  ...ExcelWorkerLoader,
  async parse(arrayBuffer: ArrayBuffer, options?: ExcelLoaderOptions): Promise<ObjectRowTable> {
    const data = parseExcel(arrayBuffer, options);
    return {shape: 'object-row-table', data};
  }
};
