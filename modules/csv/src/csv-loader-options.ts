// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
export const CSV_LOADER_VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const DEFAULT_CSV_SHAPE = 'object-row-table';

export type CSVLoaderOptions = LoaderOptions & {
  csv?: {
    shape?: 'array-row-table' | 'object-row-table';
    /** optimizes memory usage but increases parsing time. */
    optimizeMemoryUsage?: boolean;
    columnPrefix?: string;
    header?: 'auto';
    quoteChar?: string;
    escapeChar?: string;
    dynamicTyping?: boolean;
    comments?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    delimitersToGuess?: string[];
  };
};

export const CSV_LOADER_OPTIONS = {
  csv: {
    shape: DEFAULT_CSV_SHAPE,
    optimizeMemoryUsage: false,
    header: 'auto',
    columnPrefix: 'column',
    quoteChar: '"',
    escapeChar: '"',
    dynamicTyping: true,
    comments: false,
    skipEmptyLines: true,
    delimitersToGuess: [',', '\t', '|', ';']
  }
} as const satisfies CSVLoaderOptions;
