// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
import {
  triangulateOnWorker,
  parseGeoArrowOnWorker,
  TriangulationWorker,
  hardClone,
  ParseGeoArrowInput
} from '@loaders.gl/arrow';
import {fetchFile} from '@loaders.gl/core';
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';
import {GEOARROW_POINT_FILE} from './data/geoarrow/test-cases';

// WORKER TESTS
test('TriangulationWorker#plumbing', async (t) => {
  const sourceData = {
    operation: 'test',
    data: new ArrayBuffer(100)
  };

  const triangulatedData = await processOnWorker(TriangulationWorker, sourceData, {
    _workerType: 'test'
  });

  t.ok(triangulatedData, 'Triangulation worker echoed input data');

  t.rejects(
    () =>
      processOnWorker(
        TriangulationWorker,
        {operation: 'error'},
        {
          _workerType: 'test'
        }
      ),
    'Triangulation worker throws on incorrect operation'
  );

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test.skip('triangulateOnWorker', async (t) => {
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

test('parseGeoArrowOnWorker', async (t) => {
  const arrowFile = await fetchFile(GEOARROW_POINT_FILE);
  const arrowContent = await arrowFile.arrayBuffer();
  const arrowTable = arrow.tableFromIPC(arrowContent);

  // simulate parsing 1st batch/chunk of the arrow data in web worker from e.g. kepler
  const geometryColumn = arrowTable.getChild('geometry');
  const geometryChunk = geometryColumn?.data[0];

  if (geometryChunk) {
    const chunkCopy = hardClone(geometryChunk, true);
    const chunkData = {
      type: {
        ...chunkCopy?.type,
        typeId: chunkCopy?.typeId,
        listSize: chunkCopy?.type?.listSize
      },
      offset: chunkCopy.offset,
      length: chunkCopy.length,
      nullCount: chunkCopy.nullCount,
      buffers: chunkCopy.buffers,
      children: chunkCopy.children,
      dictionary: chunkCopy.dictionary
    };

    const parseGeoArrowInput: ParseGeoArrowInput = {
      operation: 'parse-geoarrow',
      chunkData,
      chunkIndex: 0,
      chunkOffset: 0,
      geometryEncoding: 'geoarrow.point',
      calculateMeanCenters: true,
      triangle: false
    };

    const parsedGeoArrowData = await parseGeoArrowOnWorker(parseGeoArrowInput, {
      _workerType: 'test'
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
