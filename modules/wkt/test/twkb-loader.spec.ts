// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile, parseSync} from '@loaders.gl/core';
import {isTWKB} from '@loaders.gl/gis';
import {TWKBLoader} from '@loaders.gl/wkt';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
// const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';

test('TWKBLoader#2D', async () => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON.type === 'GeometryCollection') {
      continue; // eslint-disable-line
    }

    // Big endian
    if (testCase.twkb && testCase.binary) {
      expect(isTWKB(testCase.twkb), 'isTWKB(2D)').toBeTruthy();
      const geometry = {...testCase.geoJSON};
      // TODO - Weird empty geometry case, is that coorrect per spec?
      if (
        geometry.coordinates.length === 1 &&
        // @ts-ignore
        geometry.coordinates[0].length === 1 &&
        // @ts-ignore
        geometry.coordinates[0][0].length === 0
      ) {
        geometry.coordinates = [];
      }
      expect(parseSync(testCase.twkb, TWKBLoader)).toEqual(geometry);
    }
  }
});

// test('TWKBLoader#Z', async () => {
//   const response = await fetchFile(WKB_Z_TEST_CASES);
//   const TEST_CASES = parseTestCases(await response.json());

//   // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
//   for (const testCase of Object.values(TEST_CASES)) {
//     if (testCase.geoJSON.type === 'GeometryCollection') {
//       continue;
//     }

//     if (testCase.wkbXdr && testCase.binary && testCase.geoJSON) {
//       t.deepEqual(parseSync(testCase.twkbXdr, TWKBLoader, {wkb: {shape: 'geojson-geometry'}}), testCase.geoJSON);
//     }
//   }

//   t.end();
// });
