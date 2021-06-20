import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseDBF, parseDBFInBatches} from './lib/parsers/parse-dbf';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * DBFLoader - DBF files are used to contain non-geometry columns in Shapefiles
 */
export const DBFWorkerLoader: Loader = {
  name: 'DBF',
  id: 'dbf',
  module: 'shapefile',
  version: VERSION,
  worker: true,
  category: 'table',
  extensions: ['dbf'],
  mimeTypes: ['application/x-dbf'],
  options: {
    dbf: {
      encoding: 'latin1'
    }
  }
};

/** DBF file loader */
export const DBFLoader: LoaderWithParser = {
  ...DBFWorkerLoader,
  parse: async (arrayBuffer, options) => parseDBF(arrayBuffer, options),
  parseSync: parseDBF,
  parseInBatches: parseDBFInBatches
};
