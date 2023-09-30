// loaders.gl, MIT license
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

import {GeoJSONTileFeature} from './tile';

type GeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'Polygon'
  | 'MultiLineString'
  | 'MultiPolygon';

type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function createFeature(
  id: string | number | null,
  type: GeometryType,
  geometry: number[],
  properties: Record<string, string>
): GeoJSONTileFeature {

  let simplifiedType: 1 | 2 | 3;
  const boundingBox: BoundingBox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };

  switch (type) {
    case 'Point':
    case 'MultiPoint':
    case 'LineString':
      simplifiedType = 1;
      calcLineBBox(feature, geometry);
      break;
    case 'Polygon':
      // the outer ring (ie [0]) contains all inner rings
      calcLineBBox(feature, geometry[0] as unknown as number[]);
      break;
    case 'MultiLineString':
      for (const line of geometry) {
        calcLineBBox(feature, line as unknown as number[]);
      }
      break;
    case 'MultiPolygon':
      for (const polygon of geometry) {
        // the outer ring (ie [0]) contains all inner rings
        calcLineBBox(feature, polygon[0]);
      }
      break;
  }

  return {
    id: id == null ? null : id,
    type,
    simplifiedType,
    geometry: geometry,
    properties,
    ...boundingBox
  };
}

function calcLineBBox(boundingBox: BoundingBox, geometry: number[]) {
  for (let i = 0; i < geometry.length; i += 3) {
    feature.minX = Math.min(feature.minX, geometry[i]);
    feature.minY = Math.min(feature.minY, geometry[i + 1]);
    feature.maxX = Math.max(feature.maxX, geometry[i]);
    feature.maxY = Math.max(feature.maxY, geometry[i + 1]);
  }
}
