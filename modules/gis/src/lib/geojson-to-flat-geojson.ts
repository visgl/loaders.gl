import {getPolygonSignedArea} from '@math.gl/polygon';

import {Feature, Position, FlatFeature} from '@loaders.gl/schema';

/**
 * Options for `geojsonToFlatGeojson`
 */
export type GeojsonToFlatGeojsonOptions = {
  coordLength: number;
  fixRingWinding: boolean;
};

// Coordinates defining a Point
type PointCoordinates = Position;
// Coordinates defining a LineString
type LineStringCoordinates = Position[];
// Coordinates defining a Polygon
type PolygonCoordinates = Position[][];

/**
 * Convert GeoJSON features to Flat GeoJSON features
 *
 * @param features
 * @param options
 * @returns an Array of Flat GeoJSON features
 */
export function geojsonToFlatGeojson(
  features: Feature[],
  options: GeojsonToFlatGeojsonOptions = {coordLength: 2, fixRingWinding: true}
): FlatFeature[] {
  return features.map((feature) => flattenFeature(feature, options));
}

/**
 * Helper function to copy Point values from `coordinates` into `data` & `indices`
 *
 * @param coordinates
 * @param data
 * @param indices
 * @param options
 */
function flattenPoint(
  coordinates: PointCoordinates,
  data: number[],
  indices: number[],
  options: GeojsonToFlatGeojsonOptions
) {
  indices.push(data.length);
  data.push(...coordinates);

  // Pad up to coordLength
  for (let i = coordinates.length; i < options.coordLength; i++) {
    data.push(0);
  }
}

/**
 * Helper function to copy LineString values from `coordinates` into `data` & `indices`
 *
 * @param coordinates
 * @param data
 * @param indices
 * @param options
 */
function flattenLineString(
  coordinates: LineStringCoordinates,
  data: number[],
  indices: number[],
  options: GeojsonToFlatGeojsonOptions
) {
  indices.push(data.length);
  for (const c of coordinates) {
    data.push(...c);

    // Pad up to coordLength
    for (let i = c.length; i < options.coordLength; i++) {
      data.push(0);
    }
  }
}

/**
 * Helper function to copy Polygon values from `coordinates` into `data` & `indices` & `areas`
 *
 * @param coordinates
 * @param data
 * @param indices
 * @param areas
 * @param options
 */
function flattenPolygon(
  coordinates: PolygonCoordinates,
  data: number[],
  indices: number[][],
  areas: number[][],
  options: GeojsonToFlatGeojsonOptions
) {
  let count = 0;
  const ringAreas: number[] = [];
  const polygons: number[] = [];
  for (const lineString of coordinates) {
    const lineString2d = lineString.map((p) => p.slice(0, 2));
    let area = getPolygonSignedArea(lineString2d.flat());
    const ccw = area < 0;

    // Exterior ring must be CCW and interior rings CW
    if (options.fixRingWinding && ((count === 0 && !ccw) || (count > 0 && ccw))) {
      lineString.reverse();
      area = -area;
    }
    ringAreas.push(area);
    flattenLineString(lineString, data, polygons, options);
    count++;
  }

  if (count > 0) {
    areas.push(ringAreas);
    indices.push(polygons);
  }
}

/**
 * Flatten single GeoJSON feature into Flat GeoJSON
 *
 * @param feature
 * @param options
 * @returns A Flat GeoJSON feature
 */
function flattenFeature(feature: Feature, options: GeojsonToFlatGeojsonOptions): FlatFeature {
  const {geometry} = feature;
  if (geometry.type === 'GeometryCollection') {
    throw new Error('GeometryCollection type not supported');
  }
  const data = [];
  const indices = [];
  let areas;
  let type;

  switch (geometry.type) {
    case 'Point':
      type = 'Point';
      flattenPoint(geometry.coordinates, data, indices, options);
      break;
    case 'MultiPoint':
      type = 'Point';
      geometry.coordinates.map((c) => flattenPoint(c, data, indices, options));
      break;
    case 'LineString':
      type = 'LineString';
      flattenLineString(geometry.coordinates, data, indices, options);
      break;
    case 'MultiLineString':
      type = 'LineString';
      geometry.coordinates.map((c) => flattenLineString(c, data, indices, options));
      break;
    case 'Polygon':
      type = 'Polygon';
      areas = [];
      flattenPolygon(geometry.coordinates, data, indices, areas, options);
      break;
    case 'MultiPolygon':
      type = 'Polygon';
      areas = [];
      geometry.coordinates.map((c) => flattenPolygon(c, data, indices, areas, options));
      break;
    default:
      throw new Error(`Unknown type: ${type}`);
  }

  return {...feature, geometry: {type, indices, data, areas}};
}
