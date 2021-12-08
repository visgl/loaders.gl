import {getPolygonSignedArea} from '@math.gl/polygon';

import {Feature, FlatFeature, FlatGeometry} from '@loaders.gl/schema';
import {Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon} from 'geojson';

export type GeojsonToFlatGeojsonOptions = {};

export function geojsonToFlatGeojson(
  features: Feature[],
  options: GeojsonToFlatGeojsonOptions = {}
): FlatFeature[] {
  return features.map(flattenFeature);
}

function flattenPoint(coordinates: number[], data: number[], lines: number[]) {
  lines.push(data.length);
  data.push(...coordinates);
}

function flattenLineString(coordinates: number[][], data: number[], lines: number[]) {
  lines.push(data.length);
  data.push(...coordinates.flat());
}

function flattenPolygon(coordinates: number[][][], data: number[], lines: number[]) {
  let i = 0;
  let ccw;
  if (coordinates.length > 1) {
    // Check holes for correct winding
    ccw = getPolygonSignedArea(coordinates[0].flat()) < 0;
  }
  for (const lineString of coordinates) {
    if (i > 0 && ccw === getPolygonSignedArea(lineString.flat()) < 0) {
      // If winding is the same of outer ring, need to reverse
      lineString.reverse();
    }
    flattenLineString(lineString, data, lines);
    i++;
  }
}

// Mimic output format of BVT
function flattenFeature(feature: Feature): FlatFeature {
  const {coordinates} = feature.geometry;
  const data = [];
  const lines = [];
  let type;

  switch (feature.geometry.type) {
    case 'Point':
      type = 'Point';
      flattenPoint(coordinates, data, lines);
      break;
    case 'MultiPoint':
      type = 'Point';
      coordinates.map((c) => flattenPoint(c, data, lines));
      break;
    case 'LineString':
      type = 'LineString';
      flattenLineString(coordinates, data, lines);
      break;
    case 'MultiLineString':
      type = 'LineString';
      coordinates.map((c) => flattenLineString(c, data, lines));
      break;
    case 'Polygon':
      type = 'Polygon';
      flattenPolygon(coordinates, data, lines);
      break;
    case 'MultiPolygon':
      type = 'Polygon';
      coordinates.map((c) => flattenPolygon(c, data, lines));
      break;
    case 'GeometryCollection':
      throw new Error('GeometryCollection type not supported');
    default:
      throw new Error(`Unknown type: ${type}`);
  }

  const geometry: FlatGeometry = {type, lines, data};

  return {...feature, geometry};
}
