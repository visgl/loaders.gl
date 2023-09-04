// loaders.gl, MIT license
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {Tables, ObjectRowTable} from '@loaders.gl/schema';
import {parseGeoPackage, DEFAULT_SQLJS_CDN} from './lib/parse-geopackage';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
// const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
const VERSION = 'latest';

export type GeoPackageLoaderOptions = LoaderOptions & {
  geopackage?: {
    /** Use null in Node */
    sqlJsCDN: string | null;
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
  };
};

export const GeoPackageLoader: LoaderWithParser<
  Tables<ObjectRowTable>,
  never,
  GeoPackageLoaderOptions
> = {
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
      sqlJsCDN: DEFAULT_SQLJS_CDN
    },
    gis: {}
  }
};

/** Geopackage loader *
export const GeoPackageTableLoader: LoaderWithParser<Record<string, Feature[]>, never, GeoPackageLoaderOptions> = {
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
      sqlJsCDN: DEFAULT_SQLJS_CDN,
    },
    gis: {
    }
  }
};
*/
