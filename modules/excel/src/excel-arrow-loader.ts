// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {ExcelLoaderOptions} from './excel-loader';
import {ExcelWorkerLoader} from './excel-loader';

/**
 * Options for parsing Excel files into Apache Arrow tables.
 *
 * The Arrow variant supports the same options as {@link ExcelLoaderOptions}.
 */
export type ExcelArrowLoaderOptions = ExcelLoaderOptions;

/**
 * Metadata-only loader for Excel files that returns an Apache Arrow table.
 *
 * `ExcelArrowLoader` parses the selected Excel worksheet into object rows using the
 * same parser as `ExcelLoader`, then converts those rows to an `ArrowTable`.
 */
export const ExcelArrowLoader = {
  ...ExcelWorkerLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  worker: false,
  options: {
    excel: {
      shape: 'arrow-table',
      sheet: undefined
    }
  },
  preload: async () => {
    const {ExcelArrowLoaderWithParser} = await import('./excel-arrow-loader-with-parser');
    return ExcelArrowLoaderWithParser;
  }
} as const satisfies Loader<ArrowTable, never, ExcelArrowLoaderOptions>;
