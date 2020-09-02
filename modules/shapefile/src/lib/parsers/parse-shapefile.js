import {Proj4Projection} from '@math.gl/proj4';
import {binaryToGeoJson, transformGeoJsonCoords} from '@loaders.gl/gis';
import {parseShx} from './parse-shx';
import {zipBatchIterators} from '../streaming/zip-batch-iterators';
import {SHPLoader} from '../../shp-loader';
import {DBFLoader} from '../../dbf-loader';

export async function* parseShapefileInBatches(asyncIterator, options, context) {
  const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};
  const {parseInBatches, fetch, url} = context;
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  const shapeIterator = await parseInBatches(asyncIterator, SHPLoader); // {shp: shx}
  const shapeHeader = await shapeIterator.next();

  // parse properties
  let propertyIterator;
  let iterator;
  const dbfResponse = await fetch(replaceExtension(url, 'dbf'));
  if (dbfResponse.ok) {
    propertyIterator = await parseInBatches(dbfResponse, DBFLoader, {
      dbf: {encoding: cpg || 'latin1'}
    });
    iterator = await zipBatchIterators(shapeIterator, propertyIterator);
  } else {
    // Ignore properties
    iterator = shapeIterator;
  }

  for await (const item of iterator) {
    let geometries;
    let properties;
    if (!propertyIterator) {
      geometries = item;
    } else {
      [geometries, properties] = item;
    }

    const geojsonGeometries = parseGeometries(geometries);
    let features = joinProperties(geojsonGeometries, properties);
    if (reproject) {
      features = reprojectFeatures(features, prj, _targetCrs);
    }
    yield {
      encoding: cpg,
      prj,
      shx,
      header: shapeHeader,
      data: features
    };
  }
}

export async function parseShapefile(arrayBuffer, options, context) {
  const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};
  const {parse} = context;
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  const {header, geometries} = await parse(arrayBuffer, SHPLoader); // {shp: shx}

  const geojsonGeometries = parseGeometries(geometries);

  // parse properties
  let properties = [];
  const {url, fetch} = context;
  const dbfResponse = await fetch(replaceExtension(url, 'dbf'));
  if (dbfResponse.ok) {
    properties = await parse(dbfResponse, DBFLoader, {dbf: {encoding: cpg || 'latin1'}});
  }

  let features = joinProperties(geojsonGeometries, properties);
  if (reproject) {
    features = reprojectFeatures(features, prj, _targetCrs);
  }

  return {
    encoding: cpg,
    prj,
    shx,
    header,
    data: features
  };
}

function parseGeometries(geometries) {
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

/**
 * Reproject GeoJSON features to output CRS
 *
 * @param  {object[]} features parsed GeoJSON features
 * @param  {string} sourceCrs source coordinate reference system
 * @param  {string} targetCrs †arget coordinate reference system
 * @return {object[]} Reprojected Features
 */
function reprojectFeatures(features, sourceCrs, targetCrs) {
  const projection = new Proj4Projection({from: sourceCrs || 'WGS84', to: targetCrs || 'WGS84'});
  return transformGeoJsonCoords(features, coord => projection.project(coord));
}

// eslint-disable-next-line max-statements
export async function loadShapefileSidecarFiles(options, context) {
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
export function replaceExtension(url, newExtension) {
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
