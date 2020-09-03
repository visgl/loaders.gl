import {BinaryGeometryData} from '@loaders.gl/gis';

export function parseSHP(arrayBuffer: ArrayBuffer, options: object): BinaryGeometryData[];

export function parseSHPInBatches(
  asyncIterator: AsyncIterator<ArrayBuffer> | Iterator<ArrayBuffer>,
  options: object
): AsyncIterator<BinaryGeometryData | object>;
