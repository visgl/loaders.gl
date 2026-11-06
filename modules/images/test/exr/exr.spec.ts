// SPDX-License-Identifier: MIT
import {test, expect} from 'vitest';
import {EXRLoaderWithParser} from '../../src/exr-loader';

/** Builds a tiny standards-shaped EXR independently of the production parser. */
function fixture(compression: number, pixelType: number, payload: Uint8Array): ArrayBuffer {
  const bytes: number[] = [];
  const integer = (value: number) => {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setInt32(0, value, true);
    bytes.push(...new Uint8Array(buffer));
  };
  const string = (text: string) => bytes.push(...new TextEncoder().encode(text), 0);
  const attribute = (name: string, type: string, data: number[]) => {
    string(name);
    string(type);
    integer(data.length);
    bytes.push(...data);
  };
  integer(20000630);
  integer(2);
  const channel = [82, 0, pixelType, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0];
  attribute('channels', 'chlist', channel);
  attribute('compression', 'compression', [compression]);
  const window = new ArrayBuffer(16);
  const view = new DataView(window);
  [-2, -1, 1, -1].forEach((value, index) => view.setInt32(index * 4, value, true));
  attribute('dataWindow', 'box2i', Array.from(new Uint8Array(window)));
  attribute('displayWindow', 'box2i', Array.from(new Uint8Array(window)));
  attribute('lineOrder', 'lineOrder', [0]);
  attribute('pixelAspectRatio', 'float', [0, 0, 128, 63]);
  attribute('screenWindowCenter', 'v2f', [0, 0, 0, 0, 0, 0, 0, 0]);
  attribute('screenWindowWidth', 'float', [0, 0, 128, 63]);
  bytes.push(0);
  const offset = bytes.length + 8;
  integer(offset);
  integer(0);
  integer(-1);
  integer(payload.length);
  bytes.push(...payload);
  return Uint8Array.from(bytes).buffer;
}

test('EXR preserves HALF HDR values, negative values and nonzero windows', async () => {
  const result = await EXRLoaderWithParser.parse(
    fixture(0, 1, new Uint8Array([0, 0xc0, 0, 0, 0, 0x3c, 0, 0x7c]))
  );
  expect(result.width).toBe(4);
  expect(result.dataWindow).toEqual([-2, -1, 1, -1]);
  expect(result.channels[0].pixelType).toBe('half');
  expect(Array.from(result.channels[0].data)).toEqual([-2, 0, 1, Infinity]);
});

test('EXR UINT retains full uint32 precision', async () => {
  const buffer = new ArrayBuffer(16);
  new DataView(buffer).setUint32(0, 0xffffffff, true);
  const result = await EXRLoaderWithParser.parse(fixture(0, 0, new Uint8Array(buffer)));
  expect(result.channels[0].data).toBeInstanceOf(Uint32Array);
  expect(result.channels[0].data[0]).toBe(4294967295);
});

test('EXR RLE reverses predictor and byte separation', async () => {
  const result = await EXRLoaderWithParser.parse(fixture(1, 1, new Uint8Array([0, 0, 6, 128])));
  expect(Array.from(result.channels[0].data)).toEqual([0, 0, 0, 0]);
});

test.each([2, 3])('EXR ZIP method %s decodes a native zlib stream', async method => {
  const predicted = new Uint8Array(16).fill(128);
  predicted[0] = 0;
  const payload = new Uint8Array(
    await new Response(
      new Blob([predicted]).stream().pipeThrough(new CompressionStream('deflate'))
    ).arrayBuffer()
  );
  const result = await EXRLoaderWithParser.parse(fixture(method, 2, payload));
  expect(Array.from(result.channels[0].data)).toEqual([0, 0, 0, 0]);
});

test('EXR rejects unknown compression, invalid offsets and truncated data', async () => {
  await expect(EXRLoaderWithParser.parse(fixture(4, 1, new Uint8Array(8)))).rejects.toThrow(
    /compression/
  );
  const buffer = fixture(0, 1, new Uint8Array(8));
  await expect(EXRLoaderWithParser.parse(buffer.slice(0, -1))).rejects.toThrow(/truncated/);
  const bad = buffer.slice(0);
  new DataView(bad).setInt32(4, 2 | 0x200, true);
  await expect(EXRLoaderWithParser.parse(bad)).rejects.toThrow(/tiled/);
});

test('EXR metadata preloads through core as named data planes', async () => {
  const {parse} = await import('@loaders.gl/core');
  const {EXRLoader} = await import('../../src/exr-loader-types');
  const result = await parse(fixture(0, 1, new Uint8Array(8)), EXRLoader);
  expect(result.channels[0].name).toBe('R');
  expect(result.channels[0].data).toBeInstanceOf(Float32Array);
});
