// import type {WorkerObject} from '@loaders.gl/worker-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TriangulationWorkerOptions = {
  operation: 'triangulate';
};

export type TriangulationWorkerInput = {
  polygonIndices: Uint16Array;
  primitivePolygonIndices: Int32Array;
  flatCoordinateArray: Float64Array;
  nDim: number;
};

export type TriangulationWorkerOutput = TriangulationWorkerInput & {
  triangleIndices: Uint32Array;
};

/**
 * Worker for tessellating geometries. Normally called through tesselateOnWorker
 */
export const TriangulationWorker = {
  id: 'triangulation',
  name: 'Tesselate',
  module: 'arrow',
  version: VERSION,
  options: {}
};

/**
 * Provide type safety
 */
export function triangulateOnWorker(
  data: TriangulationWorkerInput,
  options: TriangulationWorkerOptions
): Promise<TriangulationWorkerOutput> {
  return processOnWorker(TriangulationWorker, data, options);
}
