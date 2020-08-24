import {BinaryGeometryData, BinaryFeatureData} from '../types';

/**
 * Convert binary geometry representation to GeoJSON
 */
export function binaryToGeoJson(
  data: BinaryGeometryData | BinaryFeatureData,
  type?: string,
  format?: string
): object[];
