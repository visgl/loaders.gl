// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {HexWKBLoader} from '@loaders.gl/wkt';

const isHexWKB = HexWKBLoader.testText!;

test('datasetUtils.isHexWKB', (t) => {
  t.notOk(isHexWKB(''), 'empty string is not a valid hex wkb');

  // @ts-ignore null is not a string
  t.notOk(isHexWKB(null), 'null is not a valid hex wkb');

  const countyFIPS = '06075';
  t.notOk(isHexWKB(countyFIPS), 'FIPS code should not be a valid hex wkb');

  const h3Code = '8a2a1072b59ffff';
  t.notOk(isHexWKB(h3Code), 'H3 code should not be a valid hex wkb');

  const randomHexStr = '8a2a1072b59ffff';
  t.notOk(isHexWKB(randomHexStr), 'A random hex string should not be a valid hex wkb');

  const validWkt = '0101000000000000000000f03f0000000000000040';
  t.ok(isHexWKB(validWkt), 'A valid hex wkb should be valid');

  const validEWkt = '0101000020e6100000000000000000f03f0000000000000040';
  t.ok(isHexWKB(validEWkt), 'A valid hex ewkb should be valid');

  const validWktNDR = '00000000013ff0000000000000400000000000000040';
  t.ok(isHexWKB(validWktNDR), 'A valid hex wkb in NDR should be valid');

  const validEWktNDR = '0020000001000013ff0000000000400000000000000040';
  t.ok(isHexWKB(validEWktNDR), 'A valid hex ewkb in NDR should be valid');

  t.end();
});
