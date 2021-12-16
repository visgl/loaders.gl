import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import encodeWKB from '../../src/lib/encode-wkb';
import {parseTestCases} from './utils';

const WKB_2D_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdata2d.json';
const WKB_2D_NAN_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdata2d-nan.json';
const WKB_Z_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdataZ.json';
const WKB_Z_NAN_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdataZ-nan.json';

test('encodeWKB 2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = encodeWKB(geoJSON);
    t.deepEqual(encoded, wkb);
  }

  t.end();
});

test('encodeWKB 2D NaN', async (t) => {
  const response = await fetchFile(WKB_2D_NAN_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;

    const encoded = encodeWKB(geoJSON);
    t.deepEqual(encoded, wkb);
  }

  t.end();
});

test('encodeWKB Z', async (t) => {
  const response = await fetchFile(WKB_Z_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = encodeWKB(geoJSON, {hasZ: true});
    t.deepEqual(encoded, wkb);
  }

  t.end();
});

test('encodeWKB Z NaN', async (t) => {
  const response = await fetchFile(WKB_Z_NAN_TEST_CASES);
  const TEST_CASES = parseTestCases(await response.json());

  for (const testCase of Object.values(TEST_CASES)) {
    const {geoJSON, wkb} = testCase;
    const encoded = encodeWKB(geoJSON, {hasZ: true});
    t.deepEqual(encoded, wkb);
  }

  t.end();
});
