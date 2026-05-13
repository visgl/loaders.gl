// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {WorkerOptions} from '@loaders.gl/worker-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';
import type {BinaryDataFromGeoArrow, GeoArrowEncoding} from '@loaders.gl/geoarrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type TriangulationWorkerInput =
  | ({operation: 'triangulate'} & TriangulateInput)
  | TriangulateWKBColumnInput
  | ParseGeoArrowInput
  | {operation: 'test'; data: any};

export type TriangulationWorkerOutput =
  | ({operation: 'triangulate'} & TriangulateResult)
  | ({operation: 'triangulate-wkb-column'} & TriangulateWKBColumnResult)
  | ({operation: 'parse-geoarrow'} & ParseGeoArrowResult)
  | {operation: 'test'; data: any};

type GeoArrowChunkData = {
  type: arrow.DataType;
  offset: number;
  length: number;
  nullCount: number;
  buffers: any;
  children: GeoArrowChunkData[];
  dictionary?: arrow.Vector;
};

export type ParseGeoArrowInput = {
  operation: 'parse-geoarrow';
  chunkData: GeoArrowChunkData;
  chunkIndex: number;
  chunkOffset: number;
  geometryEncoding: GeoArrowEncoding;
  calculateMeanCenters: boolean;
  triangle: boolean;
};

export type ParseGeoArrowResult = {
  chunkIndex: number;
  binaryDataFromGeoArrow: BinaryDataFromGeoArrow | null;
};

/** Input data for operation: 'triangulate-wkb-column'. */
export type TriangulateWKBColumnInput = {
  operation: 'triangulate-wkb-column';
  chunkData: GeoArrowChunkData;
  chunkIndex: number;
};

/** Result type for operation: 'triangulate-wkb-column'. */
export type TriangulateWKBColumnResult = {
  chunkIndex: number;
  vertexIndexColumn: GeoArrowChunkData;
  vertexColumn: GeoArrowChunkData;
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
 * Triangulate a GeoArrow WKB geometry column on a worker.
 */
export function triangulateWKBColumnOnWorker(
  data: TriangulateWKBColumnInput,
  options: WorkerOptions = {}
): Promise<TriangulateWKBColumnResult> {
  return processOnWorker(TriangulationWorker, data, options);
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
