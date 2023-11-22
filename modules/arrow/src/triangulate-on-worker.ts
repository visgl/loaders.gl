// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {WorkerOptions} from '@loaders.gl/worker-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';
import {BinaryDataFromGeoArrow, GeoArrowEncoding} from '@loaders.gl/arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TriangulationWorkerInput =
  | ({operation: 'triangulate'} & TriangulateInput)
  | ParseGeoArrowInput
  | {operation: 'test'; data: any};

export type TriangulationWorkerOutput =
  | ({operation: 'triangulate'} & TriangulateResult)
  | ({operation: 'parse-geoarrow'} & ParseGeoArrowResult)
  | {operation: 'test'; data: any};

export type ParseGeoArrowInput = {
  operation: 'parse-geoarrow';
  arrowData: ArrayBuffer;
  chunkIndex: number;
  geometryColumnName: string;
  geometryEncoding: GeoArrowEncoding;
  meanCenter: boolean;
  triangle: boolean;
};

export type ParseGeoArrowResult = {
  chunkIndex: number;
  binaryGeometries: BinaryDataFromGeoArrow | null;
};

/** Input data for operation: 'triangulate' */
export type TriangulateInput = {
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
 * Triangulate a set of polygons on worker, type safe API
 */
export function triangulateOnWorker(
  data: TriangulateInput,
  options: WorkerOptions = {}
): Promise<TriangulateResult> {
  return processOnWorker(TriangulationWorker, {...data, operation: 'triangulate'}, options);
}

/**
 * Parse GeoArrow geometry colum on worker, type safe API
 */
export function parseGeoArrowOnWorker(
  data: ParseGeoArrowInput,
  options: WorkerOptions = {}
): Promise<ParseGeoArrowResult> {
  return processOnWorker(TriangulationWorker, {...data, operation: 'parse-geoarrow'}, options);
}
