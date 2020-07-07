import {SHPLoader} from './shp-loader';
import {parseShx} from './lib/parse-shx';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {LoaderObject} */
export const ShapefileLoader = {
  id: 'shp',
  name: 'Shapefile',
  category: 'geometry',
  version: VERSION,
  extensions: ['shp'],
  mimeTypes: [],
  options: {
    shapefile: {}
  },
  parse: parseShapefile
  // parseInBatches: parseShapefileInBatches
};

async function parseShapefile(arrayBuffer, options, context) {
  const {parse} = context;
  const {shx, cpg, prj} = await loadShapefileSidecarfiles(options, context);

  // parse geometries
  const shapes = await parse(arrayBuffer, SHPLoader); // , {shp: shx});

  // parse properties
  // const {url} = context;
  // const baseName = basename(url);
  // let dbfResponse = fetch(`${baseName}.dbf`);
  // const properties = await parse(dbfResponse, DBFLoader, {dbf: {cpg});

  return {
    cpg,
    prj,
    shx,
    shapes
    // properties
  };
}

/*
async function *parseShapefileInBatches(asyncIterator, options, context) {
  const {parseInBatches} = context;
  const {shx, cpg, prj} = await loadShapefileSidecarfiles(options, context);

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

// eslint-disable-next-line max-statements
async function loadShapefileSidecarfiles(options, context) {
  const {url} = context;
  const baseName = basename(url);
  const extension = extname(url);
  const upperCase = extension === extension.toUpperCase();

  // Attempt a parallel load of the small sidecar files

  // NOTE: Extensions can be both lower and uppercase
  // per spec, extensions should be lower case, but that doesn't mean they always are. See:
  // calvinmetcalf/shapefile-js#64
  // mapserver/mapserver#4712
  // https://trac.osgeo.org/mapserver/ticket/166
  // Match the case of the SHP file extension instead of firing off another request storm

  const shxPromise = context.fetch(`${baseName}${upperCase ? '.SHX' : '.shx'}`);
  const cpgPromise = context.fetch(`${baseName}${upperCase ? '.CPG' : '.cpg'}`);
  const prjPromise = context.fetch(`${baseName}${upperCase ? '.PRJ' : '.prj'}`);
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

// NOTE - this gives the entire path minus extension (not same as path.basename)
function basename(url) {
  const extIndex = url && url.lastIndexOf('.');
  return extIndex >= 0 ? url.substr(0, extIndex) : '';
}

function extname(url) {
  const extIndex = url && url.lastIndexOf('.');
  return extIndex >= 0 ? url.substr(extIndex + 1) : '';
}
