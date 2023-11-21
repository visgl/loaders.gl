// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {triangulateOnWorker, TriangulationWorker} from '@loaders.gl/arrow';
import {fetchFile} from '@loaders.gl/core';
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';
import {POINT_ARROW_FILE} from './geoarrow/convert-geoarrow-to-geojson.spec';

test('TriangulationWorker#plumbing', async (t) => {
  const arrowFile = await fetchFile(POINT_ARROW_FILE);
  const arrowContent = await arrowFile.arrayBuffer();

  // simulate parsing 1st batch/chunk of the arrow data in web worker from e.g. kepler
  const sourceData = {
    operation: 'parseGeoArrow',
    arrowData: arrowContent,
    chunkIndex: 0,
    geometryColumnName: 'geometry',
    geometryEncoding: 'geoarrow.point',
    meanCenter: true,
    triangle: false
  };
  const parsedGeoArrowData = await processOnWorker(TriangulationWorker, sourceData, {
    _workerType: 'test'
  });

  // kepler should await for the result from web worker and render the binary geometries
  console.log(parsedGeoArrowData);

  t.ok(parsedGeoArrowData, 'ParseGeoArrow worker echoed input data');
  t.end();
});

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

test.skip('triangulateOnWorker#plumbing', async (t) => {
  t.ok(triangulateOnWorker, 'triangulateOnWorker defined');
  /*
  const triangulatedData = await triangulateOnWorker(
    {
      operation: 'test',
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
  */

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});
