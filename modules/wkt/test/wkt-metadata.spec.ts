// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {WKBLoader, WKTLoader, WKTWriter, HexWKBLoader, TWKBLoader} from '@loaders.gl/wkt';
import {isHexWKB} from '../src/hex-wkb-loader';

const POINT_GEOMETRY = {
  type: 'Point' as const,
  coordinates: [1, 2]
};

test('metadata loaders preload parser implementations', async () => {
  const loaders = await Promise.all([
    WKTLoader.preload(),
    WKBLoader.preload(),
    HexWKBLoader.preload(),
    TWKBLoader.preload()
  ]);

  for (const loader of loaders) {
    expect(
      typeof loader.parseSync === 'function' || typeof loader.parseTextSync === 'function'
    ).toBe(true);
  }
});

test('WKTWriter exposes async and sync encoders', async () => {
  const expected = new TextEncoder().encode('POINT (1 2)').buffer;
  expect(await WKTWriter.encode(POINT_GEOMETRY)).toEqual(expected);
  expect(WKTWriter.encodeSync(POINT_GEOMETRY)).toEqual(expected);
});

test('isHexWKB rejects malformed candidates and accepts valid WKB headers', () => {
  expect(isHexWKB(null)).toBe(false);
  expect(isHexWKB('')).toBe(false);
  expect(isHexWKB('01')).toBe(false);
  expect(isHexWKB('010000000000000000')).toBe(true);
  expect(isHexWKB('01000000000000000g')).toBe(false);
  expect(isHexWKB('020000000000000000')).toBe(false);
});
