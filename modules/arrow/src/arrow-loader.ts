// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from './lib/arrow-table';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ArrowLoaderOptions = LoaderOptions & {
  arrow?: {
    shape:
      | 'arrow-table'
      | 'columnar-table'
      | 'array-row-table'
      | 'object-row-table'
      | 'geojson-table';
  };
};

/** ArrowJS table loader */
export const ArrowLoader: Loader<ArrowTable, never, ArrowLoaderOptions> = {
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
};
