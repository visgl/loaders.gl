// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
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
test('TriangulationWorker#plumbing', async t => {
  const sourceData = {
    operation: 'test',
    data: new ArrayBuffer(100)
  };

  const triangulatedData = await processOnWorker(
    TriangulationWorker,
    sourceData,
    getTriangulationWorkerOptions()
  );

  t.ok(triangulatedData, 'Triangulation worker echoed input data');

  t.rejects(
    () =>
      processOnWorker(TriangulationWorker, {operation: 'error'}, getTriangulationWorkerOptions()),
    'Triangulation worker throws on incorrect operation'
  );

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test.skip('triangulateOnWorker', async t => {
  t.ok(triangulateOnWorker, 'triangulateOnWorker imported ok');
  /*
  const triangulatedData = await triangulateOnWorker(
    {
      data: new ArrayBuffer(100)
    },
    {
      _workerType: 'test'
    }
  );

  t.equal(triangulatedData.operation, 'test', 'Triangulation worker got correct return type');
  if (triangulatedData.operation === 'test') {
    t.equal(triangulatedData.data?.byteLength, 100, 'Triangulation worker echoed input data');
  }

  // t.rejec(() => await processOnWorker(TriangulationWorker, sourceData, {
  //   operation: 'error',
  //   _workerType: 'test'
  // }), 'Triangulation worker throws on incorrect operation');

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }
  */
  t.end();
});

test('parseGeoArrowOnWorker', async t => {
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
    t.ok(binaryGeometries, 'ParseGeoArrow worker returned binaryGeometries');
    t.ok(bounds, 'ParseGeoArrow worker returned binaryGeometries');
    t.ok(featureTypes, 'ParseGeoArrow worker returned featureTypes');
    t.ok(meanCenters, 'ParseGeoArrow worker returned meanCenters');
  }
  t.end();
});

test('triangulateWKBColumnOnWorker', async t => {
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

    t.equals(result.chunkIndex, 0, 'worker preserves chunk index');
    t.equals(
      vertexIndexColumn.length,
      geometryColumn?.length,
      'vertex index column has one row per input geometry'
    );
    t.equals(
      vertexColumn.length,
      geometryColumn?.length,
      'vertex column has one row per input geometry'
    );
    t.ok(vertexIndexColumn.get(0)?.length > 0, 'first geometry has triangle indices');
    t.ok(vertexColumn.get(0)?.length > 0, 'first geometry has vertices');
  }

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test('triangulateWKBGeometryColumn', async t => {
  const arrowFile = await fetchFile(GEOARROW_POLYGON_WKB_FILE);
  const arrowContent = await arrowFile.arrayBuffer();
  const arrowTable = arrow.tableFromIPC(arrowContent);
  const geometryColumn = arrowTable.getChild('geometry') as arrow.Vector<arrow.Binary> | null;

  if (geometryColumn) {
    const {vertexIndices, vertices} = triangulateWKBGeometryColumn(geometryColumn);

    t.equals(
      vertexIndices.length,
      geometryColumn.length,
      'vertex index column length matches input'
    );
    t.equals(vertices.length, geometryColumn.length, 'vertex column length matches input');
    t.ok(vertexIndices.get(0)?.length > 0, 'first geometry has triangle indices');
    t.ok(vertices.get(0)?.length > 0, 'first geometry has vertices');
  }

  t.end();
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
