// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {ExcelLoaderOptions} from './excel-loader';
import {ExcelLoaderWithParser} from './excel-loader-with-parser';
import {ExcelArrowLoader as ExcelArrowLoaderMetadata} from './excel-arrow-loader';

const {preload: _ExcelArrowLoaderPreload, ...ExcelArrowLoaderMetadataWithoutPreload} =
  ExcelArrowLoaderMetadata;

/**
 * Options for parsing Excel files into Apache Arrow tables.
 *
 * The Arrow variant supports the same options as {@link ExcelLoaderOptions}.
 */
export type ExcelArrowLoaderOptions = ExcelLoaderOptions;

/**
 * Loader for Excel files that returns an Apache Arrow table.
 *
 * `ExcelArrowLoaderWithParser` parses the selected Excel worksheet into object rows using the
 * same parser as `ExcelLoaderWithParser`, then converts those rows to an `ArrowTable`.
 */
export const ExcelArrowLoaderWithParser = {
  ...ExcelArrowLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: ExcelArrowLoaderOptions) =>
    (await ExcelLoaderWithParser.parse(arrayBuffer, withArrowShape(options))) as ArrowTable
} as const satisfies LoaderWithParser<ArrowTable, never, ExcelArrowLoaderOptions>;

/**
 * Converts loader options to prefer Arrow table output from `ExcelLoaderWithParser`.
 *
 * @param options - Optional Excel loader options.
 * @returns Loader options with `excel.shape` forced to `arrow-table`.
 */
function withArrowShape(options?: ExcelArrowLoaderOptions): ExcelArrowLoaderOptions {
  return {
    ...options,
    excel: {
      ...options?.excel,
      shape: 'arrow-table'
    }
  };
}
