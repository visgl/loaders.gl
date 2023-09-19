import test from 'tape-promise/tape';
import {fetchFile, parseSync} from '@loaders.gl/core';
import {TWKBLoader, isTWKB} from '@loaders.gl/wkt';
import {parseTestCases} from './utils/parse-test-cases';

const WKB_2D_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdataZ.json';

test.only('TWKBLoader#2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const testCase of Object.values(TEST_CASES)) {
    if (testCase.geoJSON.type === 'GeometryCollection') {
      continue;
    }

    // Big endian
    if (testCase.twkb && testCase.binary) {
      t.ok(isTWKB(testCase.twkb), 'isTWKB(2D)');
      const geometry = {...testCase.geoJSON};
      // TODO - Weird empty geometry case, is that coorrect per spec?
      if (geometry.coordinates.length === 1 && geometry.coordinates[0].length === 1 && geometry.coordinates[0][0].length === 0) {
        geometry.coordinates = [];
      }
      t.deepEqual(parseSync(testCase.twkb, TWKBLoader), geometry);
    }
  }

  t.end();
});

// test('TWKBLoader#Z', async (t) => {
//   const response = await fetchFile(WKB_Z_TEST_CASES);
//   const TEST_CASES = parseTestCases(await response.json());

//   // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
//   for (const testCase of Object.values(TEST_CASES)) {
//     if (testCase.geoJSON.type === 'GeometryCollection') {
//       continue;
//     }

//     if (testCase.wkbXdr && testCase.binary && testCase.geoJSON) {
//       t.deepEqual(parseSync(testCase.twkbXdr, TWKBLoader, {wkb: {shape: 'geometry'}}), testCase.geoJSON);
//     }
//   }

//   t.end();
// });
