import {Proj4Projection} from '@math.gl/proj4';
import {transformGeoJsonCoords} from '@loaders.gl/gis';

import {deserialize as deserializeGeoJson} from 'flatgeobuf/lib/cjs/geojson';
import {deserialize as deserializeGeneric} from 'flatgeobuf/lib/cjs/generic';
import {parseProperties as parsePropertiesBinary} from 'flatgeobuf/lib/cjs/generic/feature';

import type {FlatGeobufLoaderOptions} from '../flatgeobuf-loader';
import type {GeoJSONTable, Feature, Table} from '@loaders.gl/schema';
import {fromGeometry as binaryFromGeometry} from './binary-geometries';
// import {Feature} from 'flatgeobuf/lib/cjs/feature_generated';

// TODO: reproject binary features
function binaryFromFeature(feature, header) {
  const geometry = feature.geometry();

  // FlatGeobuf files can only hold a single geometry type per file, otherwise
  // GeometryType is GeometryCollection
  // I believe geometry.type() is null (0) except when the geometry type isn't
  // known in the header?
  const geometryType = header.geometryType || geometry.type();
  const parsedGeometry = binaryFromGeometry(geometry, geometryType);
  // @ts-expect-error this looks wrong
  parsedGeometry.properties = parsePropertiesBinary(feature, header.columns);

  // TODO: wrap binary data either in points, lines, or polygons key
  return parsedGeometry;
}

/*
 * Parse FlatGeobuf arrayBuffer and return GeoJSON.
 *
 * @param arrayBuffer  A FlatGeobuf arrayBuffer
 * @return A GeoJSON geometry object
 */
export function parseFlatGeobuf(
  arrayBuffer: ArrayBuffer,
  options?: FlatGeobufLoaderOptions
): Table {
  const shape = options?.flatgeobuf?.shape;

  switch (shape) {
    case 'geojson-table': {
      const features = parseFlatGeobufToGeoJSON(arrayBuffer, options);
      const table: GeoJSONTable = {
        shape: 'geojson-table',
        type: 'FeatureCollection',
        features
      };
      return table;
    }

    case 'columnar-table': // binary + some JS arrays
      const binary = parseFlatGeobufToBinary(arrayBuffer, options);
      // @ts-expect-error
      return {shape: 'columnar-table', data: binary};

    case 'binary':
      // @ts-expect-error
      return parseFlatGeobufToBinary(arrayBuffer, options);

    default:
      throw new Error(shape);
  }
}

function parseFlatGeobufToBinary(arrayBuffer: ArrayBuffer, options: FlatGeobufLoaderOptions = {}) {
  // TODO: reproject binary features
  // const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  const array = new Uint8Array(arrayBuffer);
  // @ts-expect-error this looks wrong
  return deserializeGeneric(array, binaryFromFeature);
}

function parseFlatGeobufToGeoJSON(
  arrayBuffer: ArrayBuffer,
  options: FlatGeobufLoaderOptions = {}
): Feature[] {
  if (arrayBuffer.byteLength === 0) {
    return [];
  }

  const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  const arr = new Uint8Array(arrayBuffer);

  let headerMeta;
  // @ts-expect-error this looks wrong
  const {features} = deserializeGeoJson(arr, undefined, (header) => {
    headerMeta = header;
  });

  const crs = headerMeta && headerMeta.crs;
  let projection;
  if (reproject && crs) {
    // Constructing the projection may fail for some invalid WKT strings
    try {
      projection = new Proj4Projection({from: crs.wkt, to: _targetCrs});
    } catch (e) {
      // no op
    }
  }

  if (projection) {
    return transformGeoJsonCoords(features, (coords) => projection.project(coords));
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
export function parseFlatGeobufInBatches(stream, options: FlatGeobufLoaderOptions) {
  const shape = options.flatgeobuf?.shape;
  switch (shape) {
    case 'binary':
      return parseFlatGeobufInBatchesToBinary(stream, options);
    case 'geojson-table':
      return parseFlatGeobufInBatchesToGeoJSON(stream, options);
    default:
      throw new Error(shape);
  }
}

function parseFlatGeobufInBatchesToBinary(stream, options: FlatGeobufLoaderOptions) {
  // TODO: reproject binary streaming features
  // const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  // @ts-expect-error
  const iterator = deserializeGeneric(stream, binaryFromFeature);
  return iterator;
}

// eslint-disable-next-line complexity
async function* parseFlatGeobufInBatchesToGeoJSON(stream, options: FlatGeobufLoaderOptions) {
  const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  let headerMeta;
  const iterator = deserializeGeoJson(stream, undefined, (header) => {
    headerMeta = header;
  });

  let projection;
  let firstRecord = true;
  // @ts-expect-error this looks wrong
  for await (const feature of iterator) {
    if (firstRecord) {
      const crs = headerMeta && headerMeta.crs;
      if (reproject && crs) {
        projection = new Proj4Projection({from: crs.wkt, to: _targetCrs});
      }

      firstRecord = false;
    }

    if (reproject && projection) {
      // eslint-disable-next-line
      yield transformGeoJsonCoords([feature], (coords) => projection.project(coords));
    } else {
      yield feature;
    }
  }
}
