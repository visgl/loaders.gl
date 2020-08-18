import {BinaryGeometryData} from '../types';

export function mapBinaryCoords(
  binaryFeatures: BinaryGeometryData,
  fn: (coord: number[]) => number[]
): BinaryGeometryData;
export function mapGeoJsonCoords(features: object[], fn: (coord: number[]) => number[]): object[];
