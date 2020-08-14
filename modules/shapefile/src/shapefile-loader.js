/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {binaryToGeoJson} from '@loaders.gl/gis';
import {SHPLoader, SHP_MAGIC_NUMBER} from './shp-loader';
import {DBFLoader} from './dbf-loader';
import {parseShx} from './lib/parsers/parse-shx';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
export const ShapefileLoader = {
  id: 'shapefile',
  name: 'Shapefile',
  category: 'geometry',
  version: VERSION,
  extensions: ['shp'],
  mimeTypes: ['application/octet-stream'],
  tests: [new Uint8Array(SHP_MAGIC_NUMBER).buffer],
  options: {
    shapefile: {}
  },
  parse: parseShapefile
};

/* TODO
async function *parseShapefileInBatches(asyncIterator, options, context) {
  const {parseInBatches} = context;
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  const shapes = parseInBatches(asyncIterator, SHPLoader, {shp: shx});

  // parse properties
  // let dbfResponse = fetch(`${baseName}.dbf`);
  // const properties = parseInBatches(dbfResponse, DBFLoader, {dbf: {cpg});

  yield {
    cpg,
    prj,
    shx,
    shapes
    // properties
  };
}
*/

async function parseShapefile(arrayBuffer, options, context) {
  const {parse} = context;
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  const {header, geometries} = await parse(arrayBuffer, SHPLoader); // , {shp: shx});

  // Convert binary geometries to GeoJSON
  const geojsonGeometries = [];
  for (const geom of geometries) {
    geojsonGeometries.push(binaryToGeoJson(geom, geom.type, 'geometry'));
  }

  // parse properties
  let properties = [];
  try {
    const {url, fetch} = context;
    const dbfResponse = await fetch(replaceExtension(url, 'dbf'));
    if (dbfResponse.ok) {
      // NOTE: For some reason DBFLoader defaults to utf-8 so set default to be standards conformant
      properties = await parse(dbfResponse, DBFLoader, {dbf: {encoding: cpg || 'latin1'}});
    }
  } catch (error) {
    // Ignore properties
  }

  // Join properties and geometries into features
  const features = [];
  for (let i = 0; i < geojsonGeometries.length; i++) {
    const geometry = geojsonGeometries[i];
    const feature = {
      type: 'Feature',
      geometry,
      properties: properties[i] || {}
    };
    features.push(feature);
  }

  return {
    encoding: cpg,
    prj,
    shx,
    header,
    data: features
  };
}

// eslint-disable-next-line max-statements
async function loadShapefileSidecarFiles(options, context) {
  // Attempt a parallel load of the small sidecar files
  const {url, fetch} = context;
  const shxPromise = fetch(replaceExtension(url, 'shx'));
  const cpgPromise = fetch(replaceExtension(url, 'cpg'));
  const prjPromise = fetch(replaceExtension(url, 'prj'));
  await Promise.all([shxPromise, cpgPromise, prjPromise]);

  let shx = null;
  let cpg = null;
  let prj = null;

  const shxResponse = await shxPromise;
  if (shxResponse.ok) {
    const arrayBuffer = await shxResponse.arrayBuffer();
    shx = parseShx(arrayBuffer);
  }

  const cpgResponse = await cpgPromise;
  if (cpgResponse.ok) {
    cpg = await cpgResponse.text();
  }

  const prjResponse = await prjPromise;
  if (prjResponse.ok) {
    prj = await prjResponse.text();
  }

  return {
    shx,
    cpg,
    prj
  };
}

/**
 * Replace the extension at the end of a path.
 *
 * Matches the case of new extension with the case of the original file extension,
 * to increase the chance of finding files without firing off a request storm looking for various case combinations
 *
 * NOTE: Extensions can be both lower and uppercase
 * per spec, extensions should be lower case, but that doesn't mean they always are. See:
 * calvinmetcalf/shapefile-js#64, mapserver/mapserver#4712
 * https://trac.osgeo.org/mapserver/ticket/166
 *
 * @param {string} url
 * @param {string} newExtension
 * @returns {string}
 */
function replaceExtension(url, newExtension) {
  const baseName = basename(url);
  const extension = extname(url);
  const isUpperCase = extension === extension.toUpperCase();
  if (isUpperCase) {
    newExtension = newExtension.toUpperCase();
  }
  return `${baseName}.${newExtension}`;
}

// NOTE - this gives the entire path minus extension (i.e. NOT same as path.basename)
function basename(url) {
  const extIndex = url && url.lastIndexOf('.');
  return extIndex >= 0 ? url.substr(0, extIndex) : '';
}

function extname(url) {
  const extIndex = url && url.lastIndexOf('.');
  return extIndex >= 0 ? url.substr(extIndex + 1) : '';
}
