// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {encodeTextSync, parse, parseSync} from '@loaders.gl/core';
import {WKTCRSLoader as MetadataWKTCRSLoader, WKTCRSWriter} from '@loaders.gl/wkt';
import {WKTCRSLoader as BundledWKTCRSLoader} from '@loaders.gl/wkt/bundled';

const WKT1 =
  'PROJCS["NAD27 / UTM zone 16N",GEOGCS["NAD27",DATUM["North_American_Datum_1927",SPHEROID["Clarke 1866",6378206.4,294.9786982139006]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["central_meridian",-87],UNIT["metre",1]]';

const WKT2 = `GEODCRS["WGS 84",
  DATUM["World Geodetic System 1984",
    ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1]]],
  CS[ellipsoidal,2],
  AXIS["Latitude (lat)",north,ORDER[1]],
  AXIS["Longitude (lon)",east,ORDER[2]],
  ANGLEUNIT["degree",1.74532925199433E-2]]`;

describe('WKTCRSLoader', () => {
  test('preloads the parser implementation', async () => {
    const loader = await MetadataWKTCRSLoader.preload();
    expect(loader.parseTextSync).toBeTypeOf('function');
    expect((await parse(WKT1, MetadataWKTCRSLoader, {core: {worker: false}})).root.keyword).toBe(
      'PROJCS'
    );
  });

  test('returns the math.gl WKT syntax tree from the bundled loader', () => {
    const ast = parseSync(WKT2, BundledWKTCRSLoader);
    expect(ast).toMatchObject({
      type: 'wkt-crs',
      root: {
        type: 'node',
        keyword: 'GEODCRS',
        delimiter: 'bracket'
      }
    });
    expect(ast.root.values[2]).toEqual({
      type: 'node',
      keyword: 'CS',
      delimiter: 'bracket',
      values: [
        {type: 'enumeration', value: 'ellipsoidal'},
        {type: 'number', value: 2, raw: '2'}
      ]
    });
  });

  test('writer round trips WKT while normalizing insignificant whitespace', () => {
    const ast = parseSync(WKT2, BundledWKTCRSLoader);
    const text = encodeTextSync(ast, WKTCRSWriter);
    expect(text).not.toContain('\n');
    expect(parseSync(text, BundledWKTCRSLoader)).toEqual(ast);
  });

  test('forwards strict profile options to math.gl', () => {
    expect(() =>
      parseSync('GEOGCS["WGS 84",VENDOR[1]]', BundledWKTCRSLoader, {
        'wkt-crs': {profile: 'wkt1', strict: true}
      })
    ).toThrow('VENDOR is not defined by the wkt1 profile');
  });

  test('does not expose the legacy hybrid array/object result', () => {
    const ast = parseSync(WKT1, BundledWKTCRSLoader);
    expect(Array.isArray(ast)).toBe(false);
    expect(ast).not.toHaveProperty('PROJCS');
    expect(ast.root.values).toBeInstanceOf(Array);
  });
});
