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

function flattenPolygon(
  coordinates: Position[][],
  data: number[],
  lines: number[],
  areas: number[]
) {
  let i = 0;
  for (const lineString of coordinates) {
    const flatLineString = lineString.flat();
    let area = getPolygonSignedArea(lineString.flat());
    const ccw = area < 0;

    // Exterior ring must be CCW and interior rings CW
    if ((i === 0 && !ccw) || (i > 0 && ccw)) {
      lineString.reverse();
      area = -area;
    }
    areas.push(area);
    lines.push(data.length);
    data.push(...flatLineString);
    i++;
  }
}

function flattenFeature(feature: Feature): FlatFeature {
  const {geometry} = feature;
  if (geometry.type === 'GeometryCollection') {
    throw new Error('GeometryCollection type not supported');
  }
  const data = [];
  const lines = [];
  let areas;
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
      areas = [];
      flattenPolygon(geometry.coordinates, data, lines, areas);
      break;
    case 'MultiPolygon':
      type = 'Polygon';
      areas = [];
      geometry.coordinates.map((c) => flattenPolygon(c, data, lines, areas));
      break;
    default:
      throw new Error(`Unknown type: ${type}`);
  }

  return {...feature, geometry: {type, lines, data, areas}};
}
