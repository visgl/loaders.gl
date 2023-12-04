// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {createWorker} from '@loaders.gl/worker-utils';
import {
  getTriangleIndices,
  getBinaryGeometriesFromArrow,
  BinaryDataFromGeoArrow
} from '../geoarrow/convert-geoarrow-to-binary-geometry';
import type {
  TriangulationWorkerInput,
  TriangulateInput,
  TriangulateResult,
  ParseGeoArrowInput,
  ParseGeoArrowResult
} from '../triangulate-on-worker';

createWorker(async (data, options = {}) => {
  const input = data as TriangulationWorkerInput;
  const operation = input?.operation;
  switch (operation) {
    case 'test':
      return input;
    case 'triangulate':
      return triangulateBatch(data);
    case 'parse-geoarrow':
      return parseGeoArrowBatch(data);
    default:
      throw new Error(
        `TriangulationWorker: Unsupported operation ${operation}. Expected 'triangulate'`
      );
  }
});

function triangulateBatch(data: TriangulateInput): TriangulateResult {
  // Parse any WKT/WKB geometries
  // Build binary geometries
  // Call earcut and triangulate
  console.error('TriangulationWorker: tessellating batch', data);
  const triangleIndices = getTriangleIndices(
    data.polygonIndices,
    data.primitivePolygonIndices,
    data.flatCoordinateArray,
    data.nDim
  );
  return {...data, ...(triangleIndices ? {triangleIndices} : {})};
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
  const arrowData = new arrow.Data(
    chunkData.type,
    chunkData.offset,
    chunkData.length,
    chunkData.nullCount,
    chunkData.buffers,
    chunkData.children,
    chunkData.dictionary
  );
  // rebuild geometry column with chunkData
  const geometryColumn = arrow.makeVector(arrowData);
  if (geometryColumn) {
    // NOTE: for a rebuild arrow.Vector, there is only one chunk, so chunkIndex is always 0
    const options = {calculateMeanCenters, triangle, chunkIndex: 0, chunkOffset};
    binaryDataFromGeoArrow = getBinaryGeometriesFromArrow(
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
