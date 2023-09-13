import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type FlatGeobufLoaderOptions = LoaderOptions & {
  flatgeobuf?: {
    shape?: 'geojson-table' | 'columnar-table' | 'geojson-table' | 'geojson' | 'binary';
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
    /** @deprecated Use options.flatgeobuf.shape */
    format?: never;
  };
};

export const FlatGeobufLoader: Loader<any, any, FlatGeobufLoaderOptions> = {
  id: 'flatgeobuf',
  name: 'FlatGeobuf',
  module: 'flatgeobuf',
  version: VERSION,
  worker: true,
  extensions: ['fgb'],
  mimeTypes: ['application/octet-stream'],
  category: 'geometry',
  options: {
    flatgeobuf: {}
  }
};
