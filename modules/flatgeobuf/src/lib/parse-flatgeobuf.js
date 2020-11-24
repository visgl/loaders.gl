/* eslint-disable */
import {deserialize as deserializeGeoJson} from 'flatgeobuf/lib/cjs/geojson';
import {deserialize as deserializeGeneric} from 'flatgeobuf/lib/cjs/generic';
import {parseProperties as parsePropertiesBinary} from 'flatgeobuf/lib/cjs/generic/feature';

import {fromGeometry as binaryFromGeometry} from './binary-geometries';

function binaryFromFeature(feature, header) {
  const geometry = feature.geometry();

  // FlatGeobuf files can only hold a single geometry type per file, otherwise
  // GeometryType is GeometryCollection
  // I believe geometry.type() is null (0) except when the geometry type isn't
  // known in the header?
  const geometryType = header.geometryType || geometry.type();
  const parsedGeometry = binaryFromGeometry(geometry, geometryType);
  parsedGeometry.properties = parseProperties(feature, header.columns);

  // TODO: wrap binary data either in points, lines, or polygons key
  return parsedGeometry;
}

/*
  * Parse FlatGeobuf arrayBuffer and return GeoJSON.
  *
  * @param {arrayBuffer} _ A FlatGeobuf arrayBuffer
  * @return {?Object} A GeoJSON geometry object
  */
export function parseFlatGeobuf(input, options) {
  if (input.byteLength === 0) {
    return [];
  }

  const arr = new Uint8Array(input);
  if (options && options.gis && options.gis.format === 'binary') {
    return deserializeGeneric(arr, binaryFromFeature);
  }

  const {features} = deserializeGeoJson(arr);
  return features;
}

/*
  * Parse FlatGeobuf arrayBuffer and return GeoJSON.
  *
  * @param {ReadableStream} _ A FlatGeobuf arrayBuffer
  * @return  A GeoJSON geometry object iterator
  */
export function parseFlatGeobufInBatches(stream, options) {
  if (options && options.gis && options.gis.format === 'binary') {
    const iterator = deserializeGeneric(stream, binaryFromFeature);
    return iterator;
  }

  const iterator = deserializeGeoJson(stream);
  return iterator;
}
