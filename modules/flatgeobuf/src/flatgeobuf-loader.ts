import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type FlatGeobufLoaderOptions = LoaderOptions & {
  shape?: 'geojson' | 'binary' | 'geojson-table' | 'binary-table';
}

export const FlatGeobufLoader = {
  id: 'flatgeobuf',
  name: 'FlatGeobuf',
  module: 'flatgeobuf',
  version: VERSION,
  worker: true,
  extensions: ['fgb'],
  mimeTypes: ['application/octet-stream'],
  category: 'geometry',
  options: {
    flatgeobuf: {
      shape: undefined // Still determined by gis...
    }
  }
};

export const _typecheckFlatGeobufLoader: Loader = FlatGeobufLoader;
