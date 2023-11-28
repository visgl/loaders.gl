// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {WorkerOptions} from '@loaders.gl/worker-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TriangulationWorkerInput = TriangulateInput | {operation: 'test'; data: any};
export type TriangulationWorkerOutput = TriangulateResult | {operation: 'test'; data: any};

/** Input data for operation: 'triangulate' */
export type TriangulateInput = {
  operation: 'triangulate';
  polygonIndices: Uint16Array;
  primitivePolygonIndices: Int32Array;
  flatCoordinateArray: Float64Array;
  nDim: number;
};

/** Result type for operation: 'triangulate' */
export type TriangulateResult = TriangulateInput & {
  triangleIndices?: Uint32Array;
};

/**
 * Worker for tessellating geometries. Normally called through triangulateOnWorker
 */
export const TriangulationWorker = {
  id: 'triangulation',
  name: 'Triangulate',
  module: 'arrow',
  version: VERSION,
  options: {}
};

/**
 * Provide type safety
 */
export function triangulateOnWorker(
  data: TriangulationWorkerInput,
  options: WorkerOptions = {}
): Promise<TriangulationWorkerOutput> {
  return processOnWorker(TriangulationWorker, data, options);
}
