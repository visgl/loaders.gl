// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {updateBoundsFromGeoArrowSamples} from '@loaders.gl/arrow';

// fix a bug that map bounds are not updated correctly from arrow samples
test('ArrowUtils#updateBoundsFromGeoArrowSamples', (t) => {
  const testCases = [
    {
      coords: [0, 0, 1, 1, 2, 2],
      nDim: 2,
      bound: [0, 0, 2, 2],
      boundSample2: [0, 0, 2, 2]
    },
    {
      coords: [0, 0, 1, 1, 2, 2, 4, 4, 5, 5, 6, 6],
      nDim: 2,
      bound: [0, 0, 6, 6],
      boundSample2: [0, 0, 4, 4]
    },
    {
      coords: [0, 0, 0, 1, 1, 1, 2, 2, 2],
      nDim: 3,
      bound: [0, 0, 2, 2],
      boundSample2: [0, 0, 2, 2]
    },
    {
      coords: [0, 0, 0, 1, 1, 1, 2, 2, 2, 4, 4, 4, 5, 5, 5, 6, 6, 6],
      nDim: 3,
      bound: [0, 0, 6, 6],
      boundSample2: [0, 0, 4, 4]
    }
  ];

  testCases.forEach((testCase) => {
    const initBound: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];

    const updatedBound = updateBoundsFromGeoArrowSamples(
      new Float64Array(testCase.coords),
      testCase.nDim,
      initBound
    );
    t.deepEqual(updatedBound, testCase.bound, 'bounds updated correctly');

    const sampleSize = 2;
    const updateBoundWith2Samples = updateBoundsFromGeoArrowSamples(
      new Float64Array(testCase.coords),
      testCase.nDim,
      initBound,
      sampleSize
    );
    t.deepEqual(
      updateBoundWith2Samples,
      testCase.boundSample2,
      'bounds updated correctly with 2 samples'
    );
  });
  t.end();
});
