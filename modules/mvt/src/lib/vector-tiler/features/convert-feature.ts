// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

/* eslint-disable */
// @ts-nocheck

import type {Feature, FeatureCollection} from '@loaders.gl/schema';
import type {ProtoFeature} from './proto-feature';

import {createProtoFeature} from './proto-feature';
import {simplifyPath} from './simplify-path';

export type ConvertFeatureOptions = {
  /** max zoom to preserve detail on */
  maxZoom?: number;
  /** simplification tolerance (higher means simpler) */
  tolerance?: number;
  /** tile extent */
  extent?: number;
  /** whether to calculate line metrics */
  lineMetrics?: boolean;
};

/**
 * converts a GeoJSON feature into an intermediate projected JSON vector format
 * with simplification data
 */
export function convertFeaturesToProtoFeature(
  data: Feature | FeatureCollection,
  options: ConvertFeatureOptions
): ProtoFeature[] {
  const protoFeatures = [];
  switch (data.type) {
    case 'FeatureCollection':
      let i = 0;
      for (const feature of data.features) {
        const convertedFeatures = convertFeature(feature, options, i++);
        pushConvertedFeatures(protoFeatures, convertedFeatures);
      }
      break;
    case 'Feature':
      {
        const convertedFeatures = convertFeature(data, options);
        pushConvertedFeatures(protoFeatures, convertedFeatures);
      }
      break;
    default: {
      // single geometry or a geometry collection
      const convertedFeatures = convertFeature({geometry: data}, options);
      pushConvertedFeatures(protoFeatures, convertedFeatures);
    }
  }

  return protoFeatures;
}

function pushConvertedFeatures(protoFeatures, convertedFeatures): void {
  if (!convertedFeatures) {
    return;
  }

  if (Array.isArray(convertedFeatures)) {
    protoFeatures.push(...convertedFeatures);
    return;
  }

  protoFeatures.push(convertedFeatures);
}

/**
 * converts a GeoJSON feature into an intermediate projected JSON vector format
 * with simplification data
 */
function convertFeature(
  geojson: Feature,
  options: ConvertFeatureOptions,
  index: number
): ProtoFeature | ProtoFeature[] | undefined {
  // GeoJSON geometries can be null, but no vector tile will include them.
  if (!geojson.geometry) {
    return;
  }

  const coords = geojson.geometry.coordinates;
  const type = geojson.geometry.type;
  const tolerance = Math.pow(options.tolerance / ((1 << options.maxZoom) * options.extent), 2);
  let geometry = [];
  let id = geojson.id;
  if (options.promoteId) {
    id = geojson.properties[options.promoteId];
  } else if (options.generateId) {
    id = index || 0;
  }

  switch (type) {
    case 'Point':
      convertPoint(coords, geometry);
      break;

    case 'MultiPoint':
      for (const p of coords) {
        convertPoint(p, geometry);
      }
      break;

    case 'LineString':
      convertLine(coords, geometry, tolerance, false);
      break;

    case 'MultiLineString':
      if (options.lineMetrics) {
        // explode into linestrings to be able to track metrics
        const features = [];
        for (const line of coords) {
          geometry = [];
          convertLine(line, geometry, tolerance, false);
          features.push(createProtoFeature(id, 'LineString', geometry, geojson.properties));
        }
        return features;
      }
      convertLines(coords, geometry, tolerance, false);
      break;

    case 'Polygon':
      convertLines(coords, geometry, tolerance, true);
      break;

    case 'MultiPolygon':
      for (const polygon of coords) {
        const newPolygon = [];
        convertLines(polygon, newPolygon, tolerance, true);
        geometry.push(newPolygon);
      }
      break;

    case 'GeometryCollection': {
      const features = [];
      for (const singleGeometry of geojson.geometry.geometries) {
        const convertedFeatures = convertFeature(
          {
            id,
            geometry: singleGeometry,
            properties: geojson.properties
          },
          options,
          index
        );
        pushConvertedFeatures(features, convertedFeatures);
      }
      return features;
    }

    default:
      throw new Error('Input data is not a valid GeoJSON object.');
  }

  return createProtoFeature(id, type, geometry, geojson.properties);
}

function convertPoint(coords, out): void {
  out.push(projectX(coords[0]), projectY(coords[1]), 0);
}

function convertLine(ring: number[], out, tolerance: number, isPolygon: boolean): void {
  let x0, y0;
  let size = 0;

  for (let j = 0; j < ring.length; j++) {
    const x = projectX(ring[j][0]);
    const y = projectY(ring[j][1]);

    out.push(x, y, 0);

    if (j > 0) {
      if (isPolygon) {
        size += (x0 * y - x * y0) / 2; // area
      } else {
        size += Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2)); // length
      }
    }
    x0 = x;
    y0 = y;
  }

  const last = out.length - 3;
  out[2] = 1;
  simplifyPath(out, 0, last, tolerance);
  out[last + 2] = 1;

  out.size = Math.abs(size);
  out.start = 0;
  out.end = out.size;
}

function convertLines(rings: number[][], out, tolerance: number, isPolygon: boolean): void {
  for (let i = 0; i < rings.length; i++) {
    const geom = [];
    convertLine(rings[i], geom, tolerance, isPolygon);
    out.push(geom);
  }
}

function projectX(x: number): number {
  return x / 360 + 0.5;
}

function projectY(y: number): number {
  const sin = Math.sin((y * Math.PI) / 180);
  const y2 = 0.5 - (0.25 * Math.log((1 + sin) / (1 - sin))) / Math.PI;
  return y2 < 0 ? 0 : y2 > 1 ? 1 : y2;
}
