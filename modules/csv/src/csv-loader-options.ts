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
    /** Selects row-table, columnar-table, or Arrow-table output. */
    shape?: 'array-row-table' | 'object-row-table' | 'columnar-table' | 'arrow-table';
    /** optimizes memory usage but increases parsing time. */
    optimizeMemoryUsage?: boolean;
    columnPrefix?: string;
    header?: boolean | 'auto';
    quoteChar?: string;
    escapeChar?: string;
    dynamicTyping?: boolean;
    comments?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    /** @internal Whether the caller explicitly supplied `skipEmptyLines`. */
    skipEmptyLinesIsExplicit?: boolean;
    detectGeometryColumns?: boolean;
    geometryEncoding?: 'wkb' | 'source';
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
    detectGeometryColumns: false,
    geometryEncoding: 'wkb',
    delimitersToGuess: [',', '\t', '|', ';']
  }
} as const satisfies CSVLoaderOptions;
