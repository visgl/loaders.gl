// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import type {ProtoFeature} from './proto-feature';
import {createProtoFeature} from './proto-feature';
import {clipFeatures} from './clip-features';

/**
 * Options for wrap()
 */
export type WrapFeaturesOptions = {
  buffer: number /** number of pixels of buffer for the tile */;
  extent: number /** extent of each tile */;
  lineMetrics: boolean;
};

/**
 * Wrap across antemeridian, by clipping into two tiles, shifting the overflowing x coordinates
 * @param list of features to be wrapped
 * @param options buffer and extent
 * @returns
 */
export function wrapFeatures(
  features: ProtoFeature[],
  options: WrapFeaturesOptions
): ProtoFeature[] {
  const buffer = options.buffer / options.extent;
  let merged: ProtoFeature[] = features;
  const left = clipFeatures(features, 1, -1 - buffer, buffer, 0, -1, 2, options); // left world copy
  const right = clipFeatures(features, 1, 1 - buffer, 2 + buffer, 0, -1, 2, options); // right world copy

  if (left || right) {
    merged = clipFeatures(features, 1, -buffer, 1 + buffer, 0, -1, 2, options) || []; // center world copy

    if (left) {
      merged = shiftFeatureCoords(left, 1).concat(merged); // merge left into center
    }
    if (right) {
      merged = merged.concat(shiftFeatureCoords(right, -1)); // merge right into center
    }
  }

  return merged;
}

/**
 * Shift the x coordinates of a list of features
 * @param features list of features to shift x coordinates for
 * @param offset
 * @returns
 */
function shiftFeatureCoords(features: ProtoFeature[], offset: number): ProtoFeature[] {
  const newFeatures: ProtoFeature[] = [];

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const type = feature.type;

    let newGeometry;

    switch (type) {
      case 'Point':
      case 'MultiPoint':
      case 'LineString':
        newGeometry = shiftCoords(feature.geometry, offset);
        break;

      case 'MultiLineString':
      case 'Polygon':
        newGeometry = [];
        for (const line of feature.geometry) {
          newGeometry.push(shiftCoords(line, offset));
        }
        break;

      case 'MultiPolygon':
        newGeometry = [];
        for (const polygon of feature.geometry) {
          const newPolygon: Points = [];
          for (const line of polygon) {
            // @ts-expect-error TODO
            newPolygon.push(shiftCoords(line, offset));
          }
          newGeometry.push(newPolygon);
        }
        break;

      default:
        throw new Error(String(type));
    }

    newFeatures.push(createProtoFeature(feature.id, type, newGeometry, feature.tags));
  }

  return newFeatures;
}

class Points extends Array<number> {
  size?: number;
  start?: number;
  end?: number;
}

/**
 * Shift the x coordinate of every point
 * @param points
 * @param offset
 * @returns
 */
function shiftCoords(points: Points, offset: number): Points {
  const newPoints: Points = [];
  newPoints.size = points.size;

  if (points.start !== undefined) {
    newPoints.start = points.start;
    newPoints.end = points.end;
  }

  for (let i = 0; i < points.length; i += 3) {
    newPoints.push(points[i] + offset, points[i + 1], points[i + 2]);
  }
  return newPoints;
}
