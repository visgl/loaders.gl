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
 * Each web worker will parse the geoarrow column using one chunk/batch of arrow data, and return binary geometries to main thread.
 * The app on the main thread will render the binary geometries and the parsing will not block the main thread.
 *
 * @param data
 * @returns
 */
function parseGeoArrowBatch(data: ParseGeoArrowInput): ParseGeoArrowResult {
  let binaryDataFromGeoArrow: BinaryDataFromGeoArrow | null = null;
  const {arrowData, chunkIndex, geometryEncoding, meanCenter, triangle} = data;
  // const batches = arrow.RecordBatchReader.from(arrowData);
  console.log(arrowData, typeof arrowData);
  const newdata = new arrow.Data(
    arrowData.type,
    arrowData.offset,
    arrowData.length,
    arrowData.nullCount,
    arrowData.buffers,
    arrowData.children,
    arrowData.dictionary
  );
  const geometryColumn = arrow.makeVector(newdata);
  console.log('geometryColumn', geometryColumn.data);
  // const arrowTable = new arrow.Table([arrowData.batches]);
  // const geometryColumn = arrowTable.getChild(geometryColumnName);
  if (geometryColumn) {
    const options = {meanCenter, triangle, chunkIndex};
    binaryDataFromGeoArrow = getBinaryGeometriesFromArrow(
      geometryColumn,
      geometryEncoding,
      options
    );
    // NOTE: here binaryGeometry will be copied to main thread
    return {
      binaryDataFromGeoArrow,
      chunkIndex: data.chunkIndex
    };
  }
  return {
    binaryDataFromGeoArrow,
    chunkIndex: data.chunkIndex
  };
}
