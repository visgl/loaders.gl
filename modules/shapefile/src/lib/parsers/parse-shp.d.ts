import {BinaryGeometryData} from '@loaders.gl/gis';

export function parseSHP(arrayBuffer: ArrayBuffer, options: object): BinaryGeometryData[];

export function parseSHPInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer>,
  options: object
): AsyncIterable<BinaryGeometryData | object>;
