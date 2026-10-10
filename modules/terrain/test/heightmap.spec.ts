// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {decodeTerrainHeightmap, TERRARIUM_ELEVATION_DECODER} from '../src/heightmap';
import {makeTerrainMeshFromImage} from '../src/lib/parse-terrain';

describe('terrain heightmap decoding', () => {
  test('decodes Terrarium channel boundaries in input row order', () => {
    const data = new Uint8Array([
      0, 0, 0, 255, 127, 255, 128, 255, 128, 0, 0, 255, 128, 0, 1, 255, 128, 255, 255, 255, 129, 0,
      0, 255, 255, 255, 255, 255, 128, 1, 0, 0
    ]);
    const original = data.slice();
    const result = decodeTerrainHeightmap({data, width: 4, height: 2}, TERRARIUM_ELEVATION_DECODER);
    expect(result.width).toBe(4);
    expect(result.height).toBe(2);
    expect(result.heights).toBeInstanceOf(Float32Array);
    expect(Array.from(result.heights)).toEqual([
      -32768,
      -0.5,
      0,
      1 / 256,
      255 + 255 / 256,
      256,
      32767 + 255 / 256,
      1
    ]);
    expect(data).toEqual(original);
    expect(Object.isFrozen(TERRARIUM_ELEVATION_DECODER)).toBe(true);
  });

  test('accepts clamped RGBA views without reading outside their byte offset', () => {
    const storage = new Uint8ClampedArray([255, 255, 255, 255, 128, 10, 64, 0, 255, 255, 255, 255]);
    const result = decodeTerrainHeightmap(
      {data: storage.subarray(4, 8), width: 1, height: 1},
      TERRARIUM_ELEVATION_DECODER
    );
    expect(Array.from(result.heights)).toEqual([10.25]);
    result.heights[0] = 100;
    expect(storage[5]).toBe(10);
  });

  test('uses explicit coefficients and leaves separate outputs independent', () => {
    const image = {data: new Uint8Array([10, 20, 30, 255]), width: 1, height: 1};
    const decoder = {rScaler: 0.5, gScaler: -1, bScaler: 2, offset: -10};
    const first = decodeTerrainHeightmap(image, decoder);
    const second = decodeTerrainHeightmap(image, decoder);
    expect(Array.from(first.heights)).toEqual([35]);
    first.heights[0] = 0;
    expect(second.heights[0]).toBe(35);
  });

  test.each([
    [0, 1],
    [-1, 1],
    [1.5, 1],
    [NaN, 1],
    [Infinity, 1],
    [1, 0],
    [1, -1],
    [1, 1.5],
    [1, NaN],
    [1, Infinity],
    [Number.MAX_SAFE_INTEGER + 1, 1],
    [1, Number.MAX_SAFE_INTEGER + 1]
  ])('rejects invalid dimensions %s × %s', (width, height) => {
    expect(() =>
      decodeTerrainHeightmap({data: new Uint8Array(4), width, height}, TERRARIUM_ELEVATION_DECODER)
    ).toThrow(/dimensions/);
  });

  test.each([0, 3, 5, 8])('rejects an RGBA byte count of %s for one pixel', byteCount => {
    expect(() =>
      decodeTerrainHeightmap(
        {data: new Uint8Array(byteCount), width: 1, height: 1},
        TERRARIUM_ELEVATION_DECODER
      )
    ).toThrow(/four RGBA bytes/);
  });

  test('rejects an unsafe pixel count before allocating the output', () => {
    expect(() =>
      decodeTerrainHeightmap(
        {data: new Uint8Array(4), width: Number.MAX_SAFE_INTEGER, height: 2},
        TERRARIUM_ELEVATION_DECODER
      )
    ).toThrow(/four RGBA bytes/);
  });

  test.each([
    'rScaler',
    'gScaler',
    'bScaler',
    'offset'
  ] as const)('rejects a nonfinite %s coefficient', coefficient => {
    expect(() =>
      decodeTerrainHeightmap(
        {data: new Uint8Array(4), width: 1, height: 1},
        {...TERRARIUM_ELEVATION_DECODER, [coefficient]: Infinity}
      )
    ).toThrow(/finite numbers/);
  });

  test('mesh reconstruction preserves its padded border and decoded heights', () => {
    const mesh = makeTerrainMeshFromImage(
      {
        data: new Uint8Array([128, 0, 0, 255, 128, 1, 0, 255, 128, 2, 0, 255, 128, 3, 0, 255]),
        width: 2,
        height: 2
      },
      {
        meshMaxError: 0,
        bounds: [0, 0, 2, 2],
        elevationDecoder: TERRARIUM_ELEVATION_DECODER,
        tesselator: 'martini'
      }
    );
    const positions = mesh.attributes.POSITION.value;
    for (let index = 0; index < positions.length; index += 3) {
      const column = Math.min(positions[index], 1);
      const row = Math.min(2 - positions[index + 1], 1);
      expect(positions[index + 2]).toBe(row * 2 + column);
    }
  });
});
