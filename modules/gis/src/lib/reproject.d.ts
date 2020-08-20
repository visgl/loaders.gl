import {BinaryGeometryData} from '../types';

/**
 * Apply transformation to every coordinate of binary features
 *
 * @param  binaryFeatures binary features
 * @param  fn       Function to call on each coordinate
 * @return          Transformed binary features
 */
export function transformBinaryCoords(
  binaryFeatures: BinaryGeometryData,
  fn: (coord: number[]) => number[]
): BinaryGeometryData;

/**
 * Apply transformation to every coordinate of GeoJSON features
 *
 * @param  features Array of GeoJSON features
 * @param  fn       Function to call on each coordinate
 * @return          Transformed GeoJSON features
 */
export function transformGeoJsonCoords(features: object[], fn: (coord: number[]) => number[]): object[];
