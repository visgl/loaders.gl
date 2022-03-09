import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ArrowLoaderOptions = LoaderOptions & {
  arrow?: {
    shape: 'arrow-table' | 'columnar-table' | 'row-table' | 'array-row-table' | 'object-row-table';
  };
};

const DEFAULT_ARROW_LOADER_OPTIONS = {
  arrow: {
    shape: 'columnar-table'
  }
};

/** ArrowJS table loader */
export const ArrowLoader = {
  name: 'Apache Arrow',
  id: 'arrow',
  module: 'arrow',
  version: VERSION,
  worker: true,
  category: 'table',
  extensions: ['arrow', 'feather'],
  mimeTypes: [
    'application/vnd.apache.arrow.file',
    'application/vnd.apache.arrow.stream',
    'application/octet-stream'
  ],
  binary: true,
  tests: ['ARROW'],
  options: DEFAULT_ARROW_LOADER_OPTIONS
};

export const _typecheckArrowLoader: Loader = ArrowLoader;
