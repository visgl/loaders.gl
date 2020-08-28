/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {binaryToGeoJson} from '@loaders.gl/gis';
import {SHP_MAGIC_NUMBER} from './shp-loader';
import {SHPLoader} from './shp-loader';
import {DBFLoader} from './dbf-loader';
import {loadShapefileSidecarFiles, replaceExtension} from './lib/parsers/parse-shapefile';
import {zipBatchIterators} from './lib/streaming/zip-batch-iterators';

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
  parse: parseShapefile,
  parseInBatches: parseShapefileInBatches
};

async function* parseShapefileInBatches(asyncIterator, options, context) {
  const {parseInBatches, fetch} = context;
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  const shapeIterator = parseInBatches(asyncIterator, SHPLoader, {shp: shx});

  // parse properties
  const dbfResponse = fetch(`${context.url}.dbf`);
  const propertyIterator = parseInBatches(dbfResponse, DBFLoader, {dbf: {encoding: cpg}});

  const generator = zipBatchIterators(shapeIterator, propertyIterator);
  for await (const [shapes, properties] of generator) {
    const {header, geometries} = shapes;
    const geojsonGeometries = parseGeometries(geometries);
    const features = joinProperties(geojsonGeometries, properties);
    yield {
      encoding: cpg,
      prj,
      shx,
      header,
      data: features
    };
  }
}

async function parseShapefile(arrayBuffer, options, context) {
  const {parse} = context;
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  const {header, geometries} = await parse(arrayBuffer, SHPLoader, {shp: shx});

  const geojsonGeometries = parseGeometries(geometries);

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

  const features = joinProperties(geojsonGeometries, properties);

  return {
    encoding: cpg,
    prj,
    shx,
    header,
    data: features
  };
}

function parseGeometries(geometries, {prj}) {
  const geojsonGeometries = [];
  for (const geom of geometries) {
    geojsonGeometries.push(binaryToGeoJson(geom, geom.type, 'geometry'));
  }

  return geojsonGeometries;
}

function joinProperties(geometries, properties) {
  // Join properties and geometries into features
  const features = [];
  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i];
    const feature = {
      type: 'Feature',
      geometry,
      // properties can be undefined if dbfResponse above was empty
      properties: (properties && properties[i]) || {}
    };
    features.push(feature);
  }

  return features;
}
