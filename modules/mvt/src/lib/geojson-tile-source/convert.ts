// loaders.gl, MIT license
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import type {Feature, FeatureCollection} from '@loaders.gl/schema';
import type {GeoJSONTileFeature} from './tile';

import type {FlatPointsArray} from './wrap';
import {simplify} from './simplify';
import {createFeature} from './feature';

// converts GeoJSON feature into an intermediate projected JSON vector format with simplification data

export type ConvertOptions = {
  tolerance: number;
  extent: number;
  maxZoom: number;
  promoteId: string;
  generateId: boolean;
  lineMetrics: boolean;
};

export function convert(
  data: Feature | FeatureCollection,
  options: ConvertOptions
): GeoJSONTileFeature[] {
  const features: GeoJSONTileFeature[] = [];

  switch (data.type) {
    case 'FeatureCollection':
      for (let i = 0; i < data.features.length; i++) {
        convertFeature(features, data.features[i], i, options);
      }
      break;
    case 'Feature':
      convertFeature(features, data, 0, options);
      break;
    // default:
    //   // single geometry or a geometry collection
    //   convertFeature(features, {geometry: data}, 0, options);
  }

  return features;
}

function convertFeature(
  targetFeatures: GeoJSONTileFeature[],
  feature: Feature,
  index: number,
  options: ConvertOptions
): void {
  if (!feature.geometry) {
    return;
  }

  let id = feature.id;
  if (options.promoteId && feature.properties) {
    id = feature.properties[options.promoteId];
  } else if (options.generateId) {
    id = index || 0;
  }

  // const coords = feature.geometry.type !== 'GeometryCollection' ? feature.geometry.coordinates : [];
  const tolerance = Math.pow(options.tolerance / ((1 << options.maxZoom) * options.extent), 2);

  let geometry: number[] = [];

  switch (feature.geometry.type) {
    case 'Point':
      convertPoint(feature.geometry.coordinates, geometry);
      break;
    case 'MultiPoint':
      for (const point of feature.geometry.coordinates) {
        convertPoint(point, geometry);
      }
      break;
    case 'LineString':
      convertLine(feature.geometry.coordinates, geometry, tolerance, false);
      break;
    case 'MultiLineString':
      if (options.lineMetrics) {
        // explode into linestrings to be able to track metrics
        for (const line of feature.geometry.coordinates) {
          geometry = [];
          convertLine(line, tolerance, false, geometry);
          targetFeatures.push(createFeature(id, 'LineString', geometry, feature.properties));
        }
        return;
      } else {
        convertLines(feature.geometry.coordinates, tolerance, false, geometry);
      }
      break;
    case 'Polygon':
      convertLines(feature.geometry.coordinates, tolerance, true, geometry);
      break;
    case 'MultiPolygon':
      for (const polygon of feature.geometry.coordinates) {
        const newPolygon: number[] = [];
        convertLines(polygon, tolerance, true, newPolygon);
        geometry.push(newPolygon);
      }
      break;
    case 'GeometryCollection':
      for (const singleGeometry of feature.geometry.geometries) {
        const singleFeature: Feature = {
          id: id!,
          type: 'Feature',
          geometry: singleGeometry,
          properties: feature.properties
        };

        convertFeature(
          targetFeatures,
          singleFeature,
          index,
          options
        );
      }
      return;
    default:
      throw new Error('Input data is not a valid GeoJSON object.');
  }

  targetFeatures.push(createFeature(id, feature.geometry.type, geometry, feature.properties));
}

function convertPoint(coords: number[], target: FlatPointsArray): void {
  target.push(projectX(coords[0]), projectY(coords[1]), 0);
}

function convertLine(ring: number[][], tolerance: number, isPolygon: boolean, target: FlatPointsArray): void {
  let x0: number, y0: number;
  let size: number = 0;

  for (let j = 0; j < ring.length; j++) {
    const x = projectX(ring[j][0]);
    const y = projectY(ring[j][1]);

    target.push(x, y, 0);

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

  const last = target.length - 3;
  target[2] = 1;
  simplify(target, 0, last, tolerance);
  target[last + 2] = 1;

  target.size = Math.abs(size);
  target.start = 0;
  target.end = target.size;
}

function convertLines(rings: number[][][], tolerance: number, isPolygon: boolean, target: FlatPointsArray[]): void {
  for (let i = 0; i < rings.length; i++) {
    const geometry: FlatPointsArray = [];
    convertLine(rings[i], tolerance, isPolygon, geometry);
    target.push(geometry);
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
