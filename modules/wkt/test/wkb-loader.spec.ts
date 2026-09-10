import {expect, test} from 'vitest';
import {fetchFile, parse, parseSync} from '@loaders.gl/core';
import {isWKB} from '@loaders.gl/gis';
import {WKBLoader, WKTLoader} from '@loaders.gl/wkt/bundled';
import {parseTestCases} from '@loaders.gl/gis/test/data/wkt/parse-test-cases';
const WKB_2D_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/gis/test/data/wkt/wkb-testdataZ.json';
test('WKBLoader#2D', async () => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());
  const TEST_CASES2 = {multiPolygonWithTwoPolygons: TEST_CASES.multiPolygonWithTwoPolygons};
  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const [title, testCase] of Object.entries(TEST_CASES2)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      expect(isWKB(testCase.wkb), 'isWKB(2D)').toBeTruthy();
      const result = parseSync(testCase.wkb, WKBLoader);
      expect(result, title).toEqual(testCase.geoJSON);
    }
    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      expect(isWKB(testCase.wkbXdr), 'isWKB(2D)').toBeTruthy();
      const result = parseSync(testCase.wkbXdr, WKBLoader);
      expect(result, title).toEqual(testCase.geoJSON);
    }
  }
});
test('WKBLoader#Z', async () => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());
  // TODO parseWKB outputs TypedArrays; testCase contains regular arrays
  for (const [title, testCase] of Object.entries(TEST_CASES)) {
    // Little endian
    if (testCase.wkb && testCase.binary) {
      expect(isWKB(testCase.wkb), 'isWKB(Z)').toBeTruthy();
      // TODO - remove and fix empty handling
      if (title.startsWith('empty') || title.includes('One')) {
        continue;
      }
      const result = parseSync(testCase.wkb, WKBLoader);
      expect(result, title).toEqual(testCase.geoJSON);
    }
    // Big endian
    if (testCase.wkbXdr && testCase.binary) {
      expect(isWKB(testCase.wkbXdr), 'isWKB(Z)').toBeTruthy();
      // TODO - remove and fix empty handling
      if (title.startsWith('empty') || title.includes('One')) {
        continue;
      }
      const result = parseSync(testCase.wkbXdr, WKBLoader);
      expect(result, title).toEqual(testCase.geoJSON);
    }
  }
});

test('WKBLoader#worker', async () => {
  const result = await parse(
    new Uint8Array([
      1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 240, 63,
      0, 0, 0, 0, 0, 0, 0, 64
    ]).buffer,
    WKBLoader,
    {core: {worker: true, _workerType: 'test'}}
  );
  expect(result).toEqual({type: 'Point', coordinates: [1, 2]});
});

test('WKTLoader#worker with WKB options', async () => {
  const result = await parse(new TextEncoder().encode('POINT (3 4)').buffer, WKTLoader, {
    wkb: {workerUrl: 'unused'},
    core: {worker: true, _workerType: 'test'}
  });
  expect(result).toEqual({type: 'Point', coordinates: [3, 4]});
});
