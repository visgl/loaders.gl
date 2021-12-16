import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import encodeWKB from '../../src/lib/encode-wkb';
import hexStringToArrayBuffer from './hex-string-to-array-buffer';
import {Geometry, BinaryGeometry} from '@loaders.gl/schema';

const WKB_2D_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdata2d.json';
const WKB_Z_TEST_CASES = '@loaders.gl/wkt/test/data/wkb-testdataZ.json';

interface TestCase {
  geometry: string;
  wkt: string;
  wkb: string;
  ewkb: string;
  wkbXdr: string;
  ewkbXdr: string;
  twkb: string;
  geoJSON: Geometry;
  ewkbNoSrid: string;
  ewkbXdrNoSrid: string;
  binary: BinaryGeometry;
  // binary: Record<string, any>;
}

interface ParsedTestCase {
  geometry: string;
  wkt: string;
  wkb: ArrayBuffer;
  ewkb: ArrayBuffer;
  wkbXdr: ArrayBuffer;
  ewkbXdr: ArrayBuffer;
  twkb: ArrayBuffer;
  geoJSON: Geometry;
  ewkbNoSrid: ArrayBuffer;
  ewkbXdrNoSrid: ArrayBuffer;
  binary: BinaryGeometry;
}

test('encodeWKB2D', async (t) => {
  const response = await fetchFile(WKB_2D_TEST_CASES);
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

// TODO: put this in shared utils file to be used by both encode-wkb and parse-wkb tests
function parseTestCases(testCases: Record<string, TestCase>): Record<string, ParsedTestCase> {
  const parsedTestCases: Record<string, ParsedTestCase> = {};

  for (const [key, value] of Object.entries(testCases)) {
    const {
      geometry,
      wkt,
      wkb,
      ewkb,
      wkbXdr,
      ewkbXdr,
      twkb,
      geoJSON,
      ewkbNoSrid,
      ewkbXdrNoSrid,
      binary
    } = value;

    // Convert binary arrays into typedArray
    if (binary && binary.positions) {
      binary.positions.value = new Float64Array(binary.positions.value);
    }
    if (binary && binary.type === 'LineString') {
      binary.pathIndices.value = new Uint16Array(binary.pathIndices.value);
    }
    if (binary && binary.type === 'Polygon') {
      binary.polygonIndices.value = new Uint16Array(binary.polygonIndices.value);
      binary.primitivePolygonIndices.value = new Uint16Array(binary.primitivePolygonIndices.value);
    }

    const parsedTestCase: ParsedTestCase = {
      geometry,
      wkt,
      geoJSON,
      wkb: hexStringToArrayBuffer(wkb),
      ewkb: hexStringToArrayBuffer(ewkb),
      twkb: hexStringToArrayBuffer(twkb),
      wkbXdr: hexStringToArrayBuffer(wkbXdr),
      ewkbXdr: hexStringToArrayBuffer(ewkbXdr),
      ewkbNoSrid: hexStringToArrayBuffer(ewkbNoSrid),
      ewkbXdrNoSrid: hexStringToArrayBuffer(ewkbXdrNoSrid),
      binary
    };

    parsedTestCases[key] = parsedTestCase;
  }

  return parsedTestCases;
}
