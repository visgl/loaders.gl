// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {createWorker} from '@loaders.gl/worker-utils';
import type {BinaryDataFromGeoArrow} from '@loaders.gl/geoarrow';
import {convertGeoArrowToBinaryFeatureCollection, getTriangleIndices} from '@loaders.gl/geoarrow';
import type {
  TriangulationWorkerInput,
  TriangulateInput,
  TriangulateResult,
  TriangulateWKBColumnInput,
  TriangulateWKBColumnResult,
  ParseGeoArrowInput,
  ParseGeoArrowResult
} from '../triangulate-on-worker';
import {triangulateWKBGeometryColumn} from '../triangulate-wkb-geometry-column';

createWorker(async (data, options = {}) => {
  const input = data as TriangulationWorkerInput;
  const operation = input?.operation;
  switch (operation) {
    case 'test':
      return input;
    case 'triangulate':
      return triangulateBatch(data);
    case 'triangulate-wkb-column':
      return triangulateWKBColumn(data);
    case 'parse-geoarrow':
      return parseGeoArrowBatch(data);
    default:
      throw new Error(
        `TriangulationWorker: Unsupported operation ${operation}. Expected 'triangulate'`
      );
  }
});

/** Marker export used by the Node worker entrypoint to retain this side-effectful module. */
export const TRIANGULATION_WORKER_LOADED = true;

function triangulateBatch(data: TriangulateInput): TriangulateResult {
  // Parse any WKT/WKB geometries
  // Build binary geometries
  // Call earcut and triangulate
  const triangleIndices = getTriangleIndices(
    data.polygonIndices,
    data.primitivePolygonIndices,
    data.flatCoordinateArray,
    data.nDim
  );
  return {...data, ...(triangleIndices ? {triangleIndices} : {})};
}

/**
 * Triangulates every geometry in a GeoArrow WKB column.
 * @param data GeoArrow WKB chunk data.
 * @returns Tessellated vertex index and vertex column data.
 */
function triangulateWKBColumn(data: TriangulateWKBColumnInput): TriangulateWKBColumnResult {
  const geometryColumn = arrow.makeVector(
    rebuildArrowData(data.chunkData)
  ) as arrow.Vector<arrow.Binary>;
  const {vertexIndices, vertices} = triangulateWKBGeometryColumn(geometryColumn);

  return {
    chunkIndex: data.chunkIndex,
    vertexIndexColumn: serializeArrowData(vertexIndices.data[0]),
    vertexColumn: serializeArrowData(vertices.data[0])
  };
}

/**
 * Reading the arrow file into memory is very fast. Parsing the geoarrow column is slow, and blocking the main thread.
 * To address this issue, we can move the parsing job from main thread to parallel web workers.
 * Each web worker will parse one chunk/batch of geoarrow column, and return binary geometries to main thread.
 * The app on the main thread will render the binary geometries and the parsing will not block the main thread.
 *
 * @param data
 * @returns
 */
function parseGeoArrowBatch(data: ParseGeoArrowInput): ParseGeoArrowResult {
  let binaryDataFromGeoArrow: BinaryDataFromGeoArrow | null = null;
  const {chunkData, chunkIndex, chunkOffset, geometryEncoding, calculateMeanCenters, triangle} =
    data;
  // rebuild chunkData that is only for geoarrow column
  const arrowData = rebuildArrowData(chunkData);
  // rebuild geometry column with chunkData
  const geometryColumn = arrow.makeVector(arrowData);
  if (geometryColumn) {
    // NOTE: for a rebuild arrow.Vector, there is only one chunk, so chunkIndex is always 0
    const options = {calculateMeanCenters, triangle, chunkIndex: 0, chunkOffset};
    binaryDataFromGeoArrow = convertGeoArrowToBinaryFeatureCollection(
      geometryColumn,
      geometryEncoding,
      options
    );
    // NOTE: here binaryGeometry will be copied to main thread
    return {
      binaryDataFromGeoArrow,
      chunkIndex
    };
  }
  return {
    binaryDataFromGeoArrow,
    chunkIndex
  };
}

/**
 * Rebuilds an Arrow data node from structured-cloned worker payload.
 * @param chunkData Arrow data payload.
 * @returns Rebuilt Arrow data node.
 */
function rebuildArrowData(chunkData: TriangulateWKBColumnInput['chunkData']): arrow.Data {
  const children = chunkData.children.map(childData => rebuildArrowData(childData));
  return new arrow.Data(
    chunkData.type,
    chunkData.offset,
    chunkData.length,
    chunkData.nullCount,
    chunkData.buffers,
    children,
    chunkData.dictionary
  );
}

/**
 * Serializes an Arrow data node into the worker payload shape used by this worker.
 * @param arrowData Arrow data node.
 * @returns Structured-cloneable Arrow data payload.
 */
function serializeArrowData(arrowData: arrow.Data): TriangulateWKBColumnInput['chunkData'] {
  return {
    type: arrowData.type,
    offset: arrowData.offset,
    length: arrowData.length,
    // @ts-expect-error _nullCount is protected. Preserve the Arrow lazy null-count state.
    nullCount: arrowData._nullCount,
    buffers: arrowData.buffers,
    children: arrowData.children.map(childData => serializeArrowData(childData)),
    dictionary: arrowData.dictionary
  };
}
