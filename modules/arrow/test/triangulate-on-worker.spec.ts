// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  triangulateOnWorker,
  triangulateWKBColumnOnWorker,
  parseGeoArrowOnWorker,
  TriangulationWorker,
  splitArrowBuffers,
  ParseGeoArrowInput,
  TriangulateWKBColumnInput,
  triangulateWKBGeometryColumn
} from '@loaders.gl/arrow';
import {fetchFile} from '@loaders.gl/core';
import type {WorkerOptions} from '@loaders.gl/worker-utils';
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';
import {
  GEOARROW_POINT_FILE,
  GEOARROW_POLYGON_WKB_FILE
} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';
// WORKER TESTS
test('TriangulationWorker#plumbing', async () => {
  const sourceData = {
    operation: 'test',
    data: new ArrayBuffer(100)
  };
  const triangulatedData = await processOnWorker(
    TriangulationWorker,
    sourceData,
    getTriangulationWorkerOptions()
  );
  expect(triangulatedData, 'Triangulation worker echoed input data').toBeTruthy();
  await expect(
    processOnWorker(TriangulationWorker, {operation: 'error'}, getTriangulationWorkerOptions()),
    'Triangulation worker throws on incorrect operation'
  ).rejects.toBeDefined();
  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }
});
test.skip('triangulateOnWorker', async () => {
  expect(triangulateOnWorker, 'triangulateOnWorker imported ok').toBeTruthy();
});
test('parseGeoArrowOnWorker', async () => {
  const arrowFile = await fetchFile(GEOARROW_POINT_FILE);
  const arrowContent = await arrowFile.arrayBuffer();
  const arrowTable = arrow.tableFromIPC(arrowContent);
  // simulate parsing 1st batch/chunk of the arrow data in web worker from e.g. kepler
  const geometryColumn = arrowTable.getChild('geometry');
  const geometryChunk = geometryColumn?.data[0];
  if (geometryChunk) {
    const parseGeoArrowInput: ParseGeoArrowInput = {
      operation: 'parse-geoarrow',
      chunkData: getWorkerChunkData(geometryChunk),
      chunkIndex: 0,
      chunkOffset: 0,
      geometryEncoding: 'geoarrow.point',
      calculateMeanCenters: true,
      triangle: false
    };
    const parsedGeoArrowData = await parseGeoArrowOnWorker(parseGeoArrowInput, {
      ...getTriangulationWorkerOptions()
    });
    // kepler should await for the result from web worker and render the binary geometries
    const {binaryGeometries, bounds, featureTypes, meanCenters} =
      parsedGeoArrowData.binaryDataFromGeoArrow!;
    expect(binaryGeometries, 'ParseGeoArrow worker returned binaryGeometries').toBeTruthy();
    expect(bounds, 'ParseGeoArrow worker returned binaryGeometries').toBeTruthy();
    expect(featureTypes, 'ParseGeoArrow worker returned featureTypes').toBeTruthy();
    expect(meanCenters, 'ParseGeoArrow worker returned meanCenters').toBeTruthy();
  }
});
test('triangulateWKBColumnOnWorker', async () => {
  const arrowFile = await fetchFile(GEOARROW_POLYGON_WKB_FILE);
  const arrowContent = await arrowFile.arrayBuffer();
  const arrowTable = arrow.tableFromIPC(arrowContent);
  const geometryColumn = arrowTable.getChild('geometry');
  const geometryChunk = geometryColumn?.data[0];
  if (geometryChunk) {
    const triangulateWKBColumnInput: TriangulateWKBColumnInput = {
      operation: 'triangulate-wkb-column',
      chunkData: getWorkerChunkData(geometryChunk),
      chunkIndex: 0
    };
    const result = await triangulateWKBColumnOnWorker(triangulateWKBColumnInput, {
      ...getTriangulationWorkerOptions()
    });
    const vertexIndexColumn = arrow.makeVector(rebuildWorkerChunkData(result.vertexIndexColumn));
    const vertexColumn = arrow.makeVector(rebuildWorkerChunkData(result.vertexColumn));
    expect(result.chunkIndex, 'worker preserves chunk index').toBe(0);
    expect(vertexIndexColumn.length, 'vertex index column has one row per input geometry').toBe(
      geometryColumn?.length
    );
    expect(vertexColumn.length, 'vertex column has one row per input geometry').toBe(
      geometryColumn?.length
    );
    expect(
      vertexIndexColumn.get(0)?.length > 0,
      'first geometry has triangle indices'
    ).toBeTruthy();
    expect(vertexColumn.get(0)?.length > 0, 'first geometry has vertices').toBeTruthy();
  }
  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }
});
test('triangulateWKBGeometryColumn', async () => {
  const arrowFile = await fetchFile(GEOARROW_POLYGON_WKB_FILE);
  const arrowContent = await arrowFile.arrayBuffer();
  const arrowTable = arrow.tableFromIPC(arrowContent);
  const geometryColumn = arrowTable.getChild('geometry') as arrow.Vector<arrow.Binary> | null;
  if (geometryColumn) {
    const {vertexIndices, vertices} = triangulateWKBGeometryColumn(geometryColumn);
    expect(vertexIndices.length, 'vertex index column length matches input').toBe(
      geometryColumn.length
    );
    expect(vertices.length, 'vertex column length matches input').toBe(geometryColumn.length);
    expect(vertexIndices.get(0)?.length > 0, 'first geometry has triangle indices').toBeTruthy();
    expect(vertices.get(0)?.length > 0, 'first geometry has vertices').toBeTruthy();
  }
});
/**
 * Copies an Arrow data chunk into the structured-cloneable shape used by the worker tests.
 * @param geometryChunk Arrow data chunk.
 * @returns Worker chunk payload.
 */
function getWorkerChunkData(
  geometryChunk: arrow.Data
): ParseGeoArrowInput['chunkData'] | TriangulateWKBColumnInput['chunkData'] {
  const chunkCopy = splitArrowBuffers(geometryChunk, {copy: 'all'});
  return {
    type: {
      ...chunkCopy.type,
      typeId: chunkCopy.typeId,
      listSize: chunkCopy.type?.listSize
    },
    offset: chunkCopy.offset,
    length: chunkCopy.length,
    nullCount: chunkCopy.nullCount,
    buffers: chunkCopy.buffers,
    children: chunkCopy.children.map(childData => getWorkerChunkData(childData)),
    dictionary: chunkCopy.dictionary
  };
}
/**
 * Returns runtime-specific options for the triangulation worker tests.
 * @returns Worker options that use the local browser worker or built Node worker bundle.
 */
function getTriangulationWorkerOptions(): WorkerOptions {
  return isBrowser
    ? {_workerType: 'test'}
    : {triangulation: {workerUrl: 'modules/arrow/dist/triangulation-worker-node.js'}};
}
/**
 * Rebuilds an Arrow data chunk returned by the worker.
 * @param chunkData Worker chunk payload.
 * @returns Arrow data chunk.
 */
function rebuildWorkerChunkData(
  chunkData: ParseGeoArrowInput['chunkData'] | TriangulateWKBColumnInput['chunkData']
): arrow.Data {
  return new arrow.Data(
    chunkData.type,
    chunkData.offset,
    chunkData.length,
    chunkData.nullCount,
    chunkData.buffers,
    chunkData.children.map(childData => rebuildWorkerChunkData(childData)),
    chunkData.dictionary
  );
}
