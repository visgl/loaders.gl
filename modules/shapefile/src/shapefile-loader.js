/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {binaryToGeoJson} from '@loaders.gl/gis';
import {SHP_MAGIC_NUMBER} from './shp-loader';
import {SHPLoader} from './shp-loader';
import {DBFLoader} from './dbf-loader';
import {loadShapefileSidecarFiles, replaceExtension} from './lib/parsers/parse-shapefile';
// import {parseShx} from './parse-shx';
// import {parseDBFInBatches} from './parse-dbf-state';
// import {parseSHPInBatches} from './parse-shp-state';


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

async function *parseShapefileInBatches(asyncIterator, options, context) {
  const {parseInBatches} = context;
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  const shapeIterator = parseInBatches(asyncIterator, SHPLoader, {shp: shx});

  // parse properties
  let dbfResponse = fetch(`${context.url}.dbf`);
  const propertyIterator = parseInBatches(dbfResponse, DBFLoader, {dbf: {encoding: cpg}});

  return zipBatchIterators(shapeIterator, propertyIterator);

  // yield {
  //   cpg,
  //   prj,
  //   shx,
  //   shapes
  //   // properties
  // };
}

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
    // TODO dbfResponse.ok is true under Node when the file doesn't exist. See
    // the `ignore-properties` test case
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
      // properties can be undefined if dbfResponse above was empty
      properties: (properties && properties[i]) || {}
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
