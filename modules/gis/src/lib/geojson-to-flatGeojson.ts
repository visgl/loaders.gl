import {getPolygonSignedArea} from '@math.gl/polygon';

import {Feature, Position, FlatFeature} from '@loaders.gl/schema';

export type GeojsonToFlatGeojsonOptions = {};

export function geojsonToFlatGeojson(
  features: Feature[],
  options: GeojsonToFlatGeojsonOptions = {}
): FlatFeature[] {
  return features.map(flattenFeature);
}

function flattenPoint(coordinates: Position, data: number[], lines: number[]) {
  lines.push(data.length);
  data.push(...coordinates);
}

function flattenLineString(coordinates: Position[], data: number[], lines: number[]) {
  lines.push(data.length);
  data.push(...coordinates.flat());
}

function flattenPolygon(coordinates: Position[][], data: number[], lines: number[]) {
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
  const {geometry} = feature;
  if (geometry.type === 'GeometryCollection') {
    throw new Error('GeometryCollection type not supported');
  }
  const data = [];
  const lines = [];
  let type;

  switch (geometry.type) {
    case 'Point':
      type = 'Point';
      flattenPoint(geometry.coordinates, data, lines);
      break;
    case 'MultiPoint':
      type = 'Point';
      geometry.coordinates.map((c) => flattenPoint(c, data, lines));
      break;
    case 'LineString':
      type = 'LineString';
      flattenLineString(geometry.coordinates, data, lines);
      break;
    case 'MultiLineString':
      type = 'LineString';
      geometry.coordinates.map((c) => flattenLineString(c, data, lines));
      break;
    case 'Polygon':
      type = 'Polygon';
      flattenPolygon(geometry.coordinates, data, lines);
      break;
    case 'MultiPolygon':
      type = 'Polygon';
      geometry.coordinates.map((c) => flattenPolygon(c, data, lines));
      break;
    default:
      throw new Error(`Unknown type: ${type}`);
  }

  return {...feature, geometry: {type, lines, data}};
}
