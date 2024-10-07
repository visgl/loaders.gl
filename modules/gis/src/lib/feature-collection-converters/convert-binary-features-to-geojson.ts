// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BinaryGeometryType,
  BinaryFeatureCollection,
  BinaryFeature,
  // BinaryPointFeature,
  // BinaryLineFeature,
  // BinaryPolygonFeature,
  Feature,
  GeoJsonProperties
} from '@loaders.gl/schema';
import {convertBinaryGeometryToGeoJSON} from '../geometry-converters/convert-binary-geometry-to-geojson';

// Note:L We do not handle GeometryCollection, define a limited Geometry type that always has coordinates.
// type FeatureGeometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;

type BinaryToGeoJsonOptions = {
  type?: BinaryGeometryType;
  globalFeatureId?: number;
};

/**
 * Convert binary geometry representation to GeoJSON
 * @param data   geometry data in binary representation
 * @param options
 * @param options.type  Input data type: Point, LineString, or Polygon
 * @param options.featureId  Global feature id. If specified, only a single feature is extracted
 * @return GeoJSON objects
 */
export function convertBinaryFeatureCollectionToGeojson(
  data: BinaryFeatureCollection,
  options?: BinaryToGeoJsonOptions
): Feature[] | Feature {
  const globalFeatureId = options?.globalFeatureId;
  if (globalFeatureId !== undefined) {
    return getSingleFeature(data, globalFeatureId);
  }
  return parseFeatures(data, options?.type);
}

/**
 * Return a single feature from a binary geometry representation as GeoJSON
 * @param data   geometry data in binary representation
 * @return GeoJSON feature
 */
function getSingleFeature(data: BinaryFeatureCollection, globalFeatureId: number): Feature {
  const dataArray = normalizeInput(data);
  for (const data of dataArray) {
    let lastIndex = 0;
    let lastValue = data.featureIds.value[0];

    // Scan through data until we find matching feature
    for (let i = 0; i < data.featureIds.value.length; i++) {
      const currValue = data.featureIds.value[i];
      if (currValue === lastValue) {
        // eslint-disable-next-line no-continue
        continue;
      }
      if (globalFeatureId === data.globalFeatureIds.value[lastIndex]) {
        return parseFeature(data, lastIndex, i);
      }
      lastIndex = i;
      lastValue = currValue;
    }

    if (globalFeatureId === data.globalFeatureIds.value[lastIndex]) {
      return parseFeature(data, lastIndex, data.featureIds.value.length);
    }
  }

  throw new Error(`featureId:${globalFeatureId} not found`);
}

function parseFeatures(data: BinaryFeatureCollection, type?: BinaryGeometryType): Feature[] {
  const dataArray = normalizeInput(data, type);
  return parseFeatureCollection(dataArray);
}

// Normalize features
// Return an array of data objects, each of which have a type key
function normalizeInput(data: BinaryFeatureCollection, type?: BinaryGeometryType): BinaryFeature[] {
  const features: BinaryFeature[] = [];
  if (data.points) {
    data.points.type = 'Point';
    features.push(data.points);
  }
  if (data.lines) {
    data.lines.type = 'LineString';
    features.push(data.lines);
  }
  if (data.polygons) {
    data.polygons.type = 'Polygon';
    features.push(data.polygons);
  }

  return features;
}

/** Parse input binary data and return an array of GeoJSON Features */
function parseFeatureCollection(dataArray: BinaryFeature[]): Feature[] {
  const features: Feature[] = [];
  for (const data of dataArray) {
    if (data.featureIds.value.length === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }
    let lastIndex = 0;
    let lastValue = data.featureIds.value[0];

    // Need to deduce start, end indices of each feature
    for (let i = 0; i < data.featureIds.value.length; i++) {
      const currValue = data.featureIds.value[i];
      if (currValue === lastValue) {
        // eslint-disable-next-line no-continue
        continue;
      }

      features.push(parseFeature(data, lastIndex, i));
      lastIndex = i;
      lastValue = currValue;
    }

    // Last feature
    features.push(parseFeature(data, lastIndex, data.featureIds.value.length));
  }
  return features;
}

/** Parse input binary data and return a single GeoJSON Feature */
function parseFeature(data: BinaryFeature, startIndex?: number, endIndex?: number): Feature {
  const geometry = convertBinaryGeometryToGeoJSON(data, startIndex, endIndex);
  const properties = parseProperties(data, startIndex, endIndex);
  const fields = parseFields(data, startIndex, endIndex);
  return {type: 'Feature', geometry, properties, ...fields};
}

/** Parse input binary data and return an object of fields */
function parseFields(data, startIndex: number = 0, endIndex?: number): GeoJsonProperties {
  return data.fields && data.fields[data.featureIds.value[startIndex]];
}

/** Parse input binary data and return an object of properties */
function parseProperties(data, startIndex: number = 0, endIndex?: number): GeoJsonProperties {
  const properties = Object.assign({}, data.properties[data.featureIds.value[startIndex]]);
  for (const key in data.numericProps) {
    properties[key] = data.numericProps[key].value[startIndex];
  }
  return properties;
}
