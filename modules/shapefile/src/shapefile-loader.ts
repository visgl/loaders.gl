// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {SHPLoaderOptions} from './shp-loader';
import type {DBFLoaderOptions} from './dbf-loader';

import {SHP_MAGIC_NUMBER} from './shp-loader';
import {
  parseShapefile,
  parseShapefileInBatches,
  ShapefileOutput
} from './lib/parsers/parse-shapefile';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ShapefileLoaderOptions = LoaderOptions &
  DBFLoaderOptions &
  SHPLoaderOptions & {
    shapefile?: {
      shape?: 'geojson';
    };
    gis?: {
      reproject?: boolean;
      _targetCrs?: string;
      /** @deprecated. Use options.shapefile.shape */
      format?: 'geojson';
    };
  };

/**
 * Shapefile loader
 * @note Shapefile is multifile format and requires providing additional files
 */
export const ShapefileLoader: LoaderWithParser<
  ShapefileOutput,
  ShapefileOutput,
  ShapefileLoaderOptions
> = {
  name: 'Shapefile',
  id: 'shapefile',
  module: 'shapefile',
  version: VERSION,
  category: 'geometry',
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer],
  options: {
    shapefile: {},
    shp: {
      _maxDimensions: 4
    }
  },
  parse: parseShapefile,
  parseInBatches: parseShapefileInBatches
};
