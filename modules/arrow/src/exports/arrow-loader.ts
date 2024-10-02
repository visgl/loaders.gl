// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '../schema/arrow-table-type';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** ArrowLoader options */
export type ArrowLoaderOptions = LoaderOptions & {
  /** ArrowLoader options */
  arrow?: {
    /** Shape of returned data */
    shape: 'arrow-table' | 'columnar-table' | 'array-row-table' | 'object-row-table';
    /** Debounce time between batches (prevent excessive numbers of small batches) */
    batchDebounceMs?: number;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** ArrowJS table loader */
export const ArrowWorkerLoader = {
  dataType: null as unknown as ArrowTable,
  batchType: null as never,

  name: 'Apache Arrow',
  id: 'arrow',
  module: 'arrow',
  version: VERSION,
  // worker: true,
  category: 'table',
  extensions: ['arrow', 'feather'],
  mimeTypes: [
    'application/vnd.apache.arrow.file',
    'application/vnd.apache.arrow.stream',
    'application/octet-stream'
  ],
  binary: true,
  tests: ['ARROW'],
  options: {
    arrow: {
      shape: 'columnar-table'
    }
  }
} as const satisfies Loader<ArrowTable, never, ArrowLoaderOptions>;
