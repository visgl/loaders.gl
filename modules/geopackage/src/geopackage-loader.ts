import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import parseGeoPackage from './lib/parse-geopackage';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
// const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const VERSION = 'latest';

/** Geopackage loader */
export const GeoPackageLoader: LoaderWithParser = {
  id: 'geopackage',
  name: 'GeoPackage',
  module: 'geopackage',
  version: VERSION,
  extensions: ['gpkg'],
  mimeTypes: ['application/geopackage+sqlite3'],
  category: 'geometry',
  parse: parseGeoPackage,
  options: {
    geopackage: {
      sqlJsCDN: 'https://sql.js.org/dist/'
    }
  }
};
