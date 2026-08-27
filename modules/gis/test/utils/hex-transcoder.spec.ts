import {expect, test} from 'vitest';
import {HexWKBLoader} from '@loaders.gl/wkt';
import {decodeHex, encodeHex} from '../../src/lib/utils/hex-transcoder';
const isHexWKB = HexWKBLoader.testText;
test('datasetUtils.isHexWKB', () => {
  expect(isHexWKB(''), 'empty string is not a valid hex wkb').toBeFalsy();
  // @ts-ignore null is not a string
  expect(isHexWKB(null), 'null is not a valid hex wkb').toBeFalsy();
  const countyFIPS = '06075';
  expect(isHexWKB(countyFIPS), 'FIPS code should not be a valid hex wkb').toBeFalsy();
  const h3Code = '8a2a1072b59ffff';
  expect(isHexWKB(h3Code), 'H3 code should not be a valid hex wkb').toBeFalsy();
  const randomHexStr = '8a2a1072b59ffff';
  expect(isHexWKB(randomHexStr), 'A random hex string should not be a valid hex wkb').toBeFalsy();
  const validWkt = '0101000000000000000000f03f0000000000000040';
  expect(isHexWKB(validWkt), 'A valid hex wkb should be valid').toBeTruthy();
  const validEWkt = '0101000020e6100000000000000000f03f0000000000000040';
  expect(isHexWKB(validEWkt), 'A valid hex ewkb should be valid').toBeTruthy();
  const validWktNDR = '00000000013ff0000000000000400000000000000040';
  expect(isHexWKB(validWktNDR), 'A valid hex wkb in NDR should be valid').toBeTruthy();
  const validEWktNDR = '0020000001000013ff0000000000400000000000000040';
  expect(isHexWKB(validEWktNDR), 'A valid hex ewkb in NDR should be valid').toBeTruthy();
});

test('hex transcoder round-trips bytes and handles empty input', () => {
  const bytes = new Uint8Array([0, 1, 15, 16, 127, 128, 255]);

  expect(encodeHex(bytes)).toBe('00010f107f80ff');
  expect(Array.from(decodeHex('00010f107f80ff'))).toEqual(Array.from(bytes));
  expect(encodeHex(new Uint8Array())).toBe('');
  expect(Array.from(decodeHex(''))).toEqual([]);
});
