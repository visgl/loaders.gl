import {BinaryGeometryData, BinaryFeatureData} from '../types';

/**
 * Convert binary geometry representation to GeoJSON
 *
 * @param data   geometry data in binary representation
 * @param  {string?} type   Input data type: Point, LineString, or Polygon
 * @param  {string?} format Output format, either geometry or feature
 * @return GeoJSON objects
 */
export function binaryToGeoJson(
  data: BinaryGeometryData | BinaryFeatureData,
  type?: string,
  format?: string
): object[];
