// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Proj4Projection} from '@math.gl/proj4';
import {transformGeoJsonCoords} from '@loaders.gl/gis';

import type {GeoJSONTable, Table, Schema} from '@loaders.gl/schema';

import {fgbToBinaryGeometry} from './binary-geometries';
import {getSchemaFromFGBHeader} from './get-schema-from-fgb-header';

import * as fgb from '../flatgeobuf/3.27.2';
import * as geojson from '../flatgeobuf/3.27.2/geojson';
import * as generic from '../flatgeobuf/3.27.2/generic';
import {parseProperties as parsePropertiesBinary} from '../flatgeobuf/3.27.2/generic/feature';

const deserializeGeoJson = geojson.deserialize;
const deserializeGeneric = generic.deserialize;
// const parsePropertiesBinary = FlatgeobufFeature.parseProperties;

export type ParseFlatGeobufOptions = {
  shape?: 'geojson-table' | 'columnar-table' | 'binary';
  /** If supplied, only loads features within the bounding box */
  boundingBox?: [[number, number], [number, number]];
  /** Desired output CRS */
  crs?: string;
  /** Should geometries be reprojected to target CRS */
  reproject?: boolean;
};

/*
 * Parse FlatGeobuf arrayBuffer and return GeoJSON.
 *
 * @param arrayBuffer  A FlatGeobuf arrayBuffer
 * @return A GeoJSON geometry object
 */
export function parseFlatGeobuf(arrayBuffer: ArrayBuffer, options: ParseFlatGeobufOptions): Table {
  const shape = options.shape;

  switch (shape) {
    case 'geojson-table': {
      return parseFlatGeobufToGeoJSONTable(arrayBuffer, options);
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

function parseFlatGeobufToBinary(arrayBuffer: ArrayBuffer, options: ParseFlatGeobufOptions = {}) {
  // TODO: reproject binary features
  // const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  const array = new Uint8Array(arrayBuffer);
  // @ts-expect-error
  return deserializeGeneric(array, fgbToBinaryGeometry);
}

function parseFlatGeobufToGeoJSONTable(
  arrayBuffer: ArrayBuffer,
  options: ParseFlatGeobufOptions
): GeoJSONTable {
  if (arrayBuffer.byteLength === 0) {
    return {shape: 'geojson-table', type: 'FeatureCollection', features: []};
  }

  const {reproject = false, crs = 'WGS84'} = options;

  const arr = new Uint8Array(arrayBuffer);

  let fgbHeader: fgb.HeaderMeta | undefined;
  let schema: Schema | undefined;

  const rect = options.boundingBox && convertBoundingBox(options.boundingBox);

  // @ts-expect-error this looks wrong
  let {features} = deserializeGeoJson(arr, rect, (headerMeta) => {
    fgbHeader = headerMeta;
    schema = getSchemaFromFGBHeader(fgbHeader);
  });

  const fromCRS = fgbHeader?.crs?.wkt;
  let projection;
  if (reproject && fromCRS) {
    // Constructing the projection may fail for some invalid WKT strings
    try {
      projection = new Proj4Projection({from: fromCRS, to: crs});
    } catch (error) {
      // no op
    }
  }

  if (projection) {
    features = transformGeoJsonCoords(features, (coords) => projection.project(coords));
  }

  return {shape: 'geojson-table', schema, type: 'FeatureCollection', features};
}

/*
 * Parse FlatGeobuf arrayBuffer and return GeoJSON.
 *
 * @param {ReadableStream} _ A FlatGeobuf arrayBuffer
 * @return  A GeoJSON geometry object iterator
 */
// eslint-disable-next-line complexity
export function parseFlatGeobufInBatches(stream, options: ParseFlatGeobufOptions) {
  const shape = options.shape;
  switch (shape) {
    case 'binary':
      return parseFlatGeobufInBatchesToBinary(stream, options);
    case 'geojson-table':
      return parseFlatGeobufInBatchesToGeoJSON(stream, options);
    default:
      throw new Error(shape);
  }
}

function parseFlatGeobufInBatchesToBinary(stream, options: ParseFlatGeobufOptions) {
  // TODO: reproject binary streaming features
  // const {reproject = false, _targetCrs = 'WGS84'} = (options && options.gis) || {};

  const rect = options.boundingBox && convertBoundingBox(options.boundingBox);

  // @ts-expect-error
  const iterator = deserializeGeneric(stream, binaryFromFeature, rect);
  return iterator;
}

/**
 * @todo this does not return proper GeoJSONTable batches
 * @param stream
 * @param options
 */
// eslint-disable-next-line complexity
async function* parseFlatGeobufInBatchesToGeoJSON(stream, options: ParseFlatGeobufOptions) {
  const {reproject = false, crs = 'WGS84'} = options || {};

  let fgbHeader;
  // let schema: Schema | undefined;
  const iterator = deserializeGeoJson(stream, undefined, (headerMeta) => {
    fgbHeader = headerMeta;
    // schema = getSchemaFromFGBHeader(fgbHeader);
  });

  let projection;
  let firstRecord = true;
  // @ts-expect-error this looks wrong
  for await (const feature of iterator) {
    if (firstRecord) {
      const fromCRS = fgbHeader?.crs?.wkt;
      if (reproject && fromCRS) {
        projection = new Proj4Projection({from: fromCRS, to: crs});
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

// HELPERS

function convertBoundingBox(boundingBox: [[number, number], [number, number]]): fgb.Rect {
  return {
    minX: boundingBox[0][0],
    minY: boundingBox[0][1],
    maxX: boundingBox[1][0],
    maxY: boundingBox[1][1]
  };
}

// TODO: reproject binary features
function binaryFromFeature(feature: fgb.Feature, header: fgb.HeaderMeta) {
  const geometry = feature.geometry();

  // FlatGeobuf files can only hold a single geometry type per file, otherwise
  // GeometryType is GeometryCollection
  // I believe geometry.type() is null (0) except when the geometry type isn't
  // known in the header?
  const geometryType = header.geometryType || geometry?.type();
  const parsedGeometry = fgbToBinaryGeometry(geometry, geometryType!);
  // @ts-expect-error this looks wrong
  parsedGeometry.properties = parsePropertiesBinary(feature, header.columns);

  // TODO: wrap binary data either in points, lines, or polygons key
  return parsedGeometry;
}
