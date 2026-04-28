// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/schema';
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

/** Preloads the parser-bearing Excel loader implementation. */
async function preload() {
  const {ExcelLoaderWithParser} = await import('./excel-loader-with-parser');
  return ExcelLoaderWithParser;
}

/** Metadata-only worker loader for Excel files. */
export const ExcelWorkerLoader = {
  ...ExcelFormat,
  dataType: null as unknown as ObjectRowTable | ArrowTable,
  batchType: null as never,
  version: VERSION,
  worker: true,
  workerFile: 'excel-classic.js',
  workerModuleFile: 'excel-module.js',
  workerNodeFile: 'excel-classic-node.cjs',
  options: {
    excel: {
      shape: 'object-row-table',
      sheet: undefined // Load default Sheet
    }
  },
  preload
} as const satisfies Loader<ObjectRowTable | ArrowTable, never, ExcelLoaderOptions>;

/** Metadata-only loader for Excel files. */
export const ExcelLoader = {
  ...ExcelWorkerLoader,
  preload
} as const satisfies Loader<ObjectRowTable | ArrowTable, never, ExcelLoaderOptions>;
