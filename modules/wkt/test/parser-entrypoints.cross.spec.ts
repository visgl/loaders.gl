// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {WKTCRSLoaderWithParser} from '../src/wkt-crs-loader-with-parser';
import {WKTLoaderWithParser} from '../src/wkt-loader-with-parser';
import {WKBLoaderWithParser, parseWKB} from '../src/wkb-loader-with-parser';
import {HexWKBLoaderWithParser} from '../src/hex-wkb-loader-with-parser';
import {TWKBLoaderWithParser} from '../src/twkb-loader-with-parser';
import {WKTWriter} from '../src/wkt-writer';
import {WKTCRSWriter} from '../src/wkt-crs-writer';
import {TWKBWriter} from '../src/twkb-writer';

const POINT_WKB_HEX = '0101000000000000000000f03f0000000000000040';
const POINT_WKB = Uint8Array.from(POINT_WKB_HEX.match(/../g)!, value => parseInt(value, 16));
const POINT_GEOMETRY = {type: 'Point' as const, coordinates: [1, 2]};

describe('WKT parser entry points', () => {
  test('supports async and synchronous text parsing', async () => {
    expect(WKTLoaderWithParser.parseTextSync('POINT (1 2)')).toEqual(POINT_GEOMETRY);
    await expect(
      WKTLoaderWithParser.parse(new TextEncoder().encode('POINT (3 4)').buffer)
    ).resolves.toEqual({type: 'Point', coordinates: [3, 4]});
  });

  test('supports WKB, hexadecimal WKB, and TWKB parser forms', async () => {
    expect(parseWKB(POINT_WKB.buffer)).toEqual(POINT_GEOMETRY);
    expect(WKBLoaderWithParser.parseSync(POINT_WKB.buffer)).toEqual(POINT_GEOMETRY);
    await expect(WKBLoaderWithParser.parse(POINT_WKB.buffer)).resolves.toEqual(POINT_GEOMETRY);

    expect(HexWKBLoaderWithParser.parseTextSync(POINT_WKB_HEX)).toEqual(POINT_GEOMETRY);
    await expect(
      HexWKBLoaderWithParser.parse(new TextEncoder().encode(POINT_WKB_HEX).buffer)
    ).resolves.toEqual(POINT_GEOMETRY);

    const twkb = TWKBWriter.encodeSync(POINT_GEOMETRY);
    expect(TWKBLoaderWithParser.parseSync(twkb)).toEqual(POINT_GEOMETRY);
    await expect(TWKBLoaderWithParser.parse(twkb)).resolves.toEqual(POINT_GEOMETRY);
  });

  test('rejects unsupported WKB output shapes', () => {
    expect(() => parseWKB(POINT_WKB.buffer, {shape: 'unsupported' as never})).toThrow(
      'unsupported'
    );
  });
});

describe('WKT CRS parser and writers', () => {
  const wktCrs = 'GEOGCRS["WGS 84",DATUM["World Geodetic System 1984"]]';

  test('supports async and synchronous CRS parsing', async () => {
    const syncAst = WKTCRSLoaderWithParser.parseTextSync(wktCrs);
    expect(syncAst.root.keyword).toBe('GEOGCRS');
    await expect(
      WKTCRSLoaderWithParser.parse(new TextEncoder().encode(wktCrs).buffer)
    ).resolves.toEqual(syncAst);
  });

  test('supports async, sync, and text writer entry points', async () => {
    const expectedWkt = WKTWriter.encodeTextSync(POINT_GEOMETRY);
    expect(new TextDecoder().decode(WKTWriter.encodeSync(POINT_GEOMETRY))).toBe(expectedWkt);
    await expect(WKTWriter.encode(POINT_GEOMETRY)).resolves.toEqual(
      new TextEncoder().encode(expectedWkt).buffer
    );

    const ast = WKTCRSLoaderWithParser.parseTextSync(wktCrs);
    const expectedCrsText = WKTCRSWriter.encodeTextSync(ast);
    expect(new TextDecoder().decode(WKTCRSWriter.encodeSync(ast))).toBe(expectedCrsText);
    await expect(WKTCRSWriter.encode(ast)).resolves.toEqual(
      new TextEncoder().encode(expectedCrsText).buffer
    );
  });
});
