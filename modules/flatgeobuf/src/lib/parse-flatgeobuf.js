import {Proj4Projection} from '@math.gl/proj4';
import {transformGeoJsonCoords} from '@loaders.gl/gis';

import {deserialize as deserializeGeoJson} from 'flatgeobuf/lib/cjs/geojson';
import {deserialize as deserializeGeneric} from 'flatgeobuf/lib/cjs/generic';
import {parseProperties as parsePropertiesBinary} from 'flatgeobuf/lib/cjs/generic/feature';

import {fromGeometry as binaryFromGeometry} from './binary-geometries';

// TODO: reproject binary features
function binaryFromFeature(feature, header) {
  const geometry = feature.geometry();

  // FlatGeobuf files can only hold a single geometry type per file, otherwise
  // GeometryType is GeometryCollection
  // I believe geometry.type() is null (0) except when the geometry type isn't
  // known in the header?
  const geometryType = header.geometryType || geometry.type();
  const parsedGeometry = binaryFromGeometry(geometry, geometryType);
  parsedGeometry.properties = parsePropertiesBinary(feature, header.columns);

  // TODO: wrap binary data either in points, lines, or polygons key
  return parsedGeometry;
}

/*
  * Parse FlatGeobuf arrayBuffer and return GeoJSON.
  *
  * @param {arrayBuffer} _ A FlatGeobuf arrayBuffer
  * @return {?Object} A GeoJSON geometry object
  */
// eslint-disable-next-line complexity
export function parseFlatGeobuf(arrayBuffer, options) {
  const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  if (arrayBuffer.byteLength === 0) {
    return [];
  }

  const arr = new Uint8Array(arrayBuffer);
  // TODO: reproject binary features
  if (options && options.gis && options.gis.format === 'binary') {
    return deserializeGeneric(arr, binaryFromFeature);
  }

  let headerMeta;
  const {features} = deserializeGeoJson(arr, false, header => {
    headerMeta = header;
  });

  if (
    reproject &&
    headerMeta &&
    headerMeta.crs &&
    (headerMeta.crs.org !== 'EPSG' || headerMeta.crs.code !== 4326)
  ) {
    return reprojectFeatures(features, headerMeta.crs.wkt, _targetCrs);
  }

  return features;
}

/*
  * Parse FlatGeobuf arrayBuffer and return GeoJSON.
  *
  * @param {ReadableStream} _ A FlatGeobuf arrayBuffer
  * @return  A GeoJSON geometry object iterator
  */
// eslint-disable-next-line complexity
export async function* parseFlatGeobufInBatches(stream, options) {
  const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  if (options && options.gis && options.gis.format === 'binary') {
    const iterator = deserializeGeneric(stream, binaryFromFeature);
    for await (const item of iterator) {
      yield item;
    }
    return;
  }

  let headerMeta;
  const iterator = deserializeGeoJson(stream, false, header => {
    headerMeta = header;
  });

  let projection;
  let firstRecord = true;
  for await (const feature of iterator) {
    if (firstRecord) {
      const crs = headerMeta && headerMeta.crs;
      if (reproject && crs && (crs.org !== 'EPSG' || crs.code !== 4326)) {
        projection = new Proj4Projection({from: crs.wkt, to: _targetCrs});
      }

      firstRecord = false;
    }

    if (reproject && projection) {
      yield transformGeoJsonCoords([feature], projection.project)[0];
    } else {
      yield feature;
    }
  }
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
  if (!sourceCrs && !targetCrs) {
    return features;
  }

  const projection = new Proj4Projection({from: sourceCrs || 'WGS84', to: targetCrs || 'WGS84'});
  return transformGeoJsonCoords(features, coord => projection.project(coord));
}
