// SPDX-License-Identifier: MIT
import {test, expect} from 'vitest';
import {EXRLoaderWithParser} from '../../src/exr-loader';

/** Header attribute bytes used by the independent fixture writer. */
type EXRFixtureAttribute = {
  /** Wire attribute type. */
  type: string;
  /** Encoded attribute payload. */
  data: readonly number[];
};
/** Small fixture variations for valid data and malformed wire boundaries. */
type EXRFixtureOptions = {
  /** Data-window width. */
  width?: number;
  /** Named attribute replacements; null omits an attribute. */
  attributes?: Record<string, EXRFixtureAttribute | null>;
  /** Optional part-type declaration. */
  partType?: string;
  /** Writes a duplicate lineOrder attribute. */
  duplicateLineOrder?: boolean;
  /** Override for the absolute chunk pointer. */
  chunkOffset?: number;
  /** Override for the chunk's first Y coordinate. */
  chunkY?: number;
  /** Override for the stored byte count. */
  packedSize?: number;
};
/** Builds a tiny standards-shaped EXR independently of the production parser. */
function fixture(
  compression: number,
  pixelType: number,
  payload: Uint8Array,
  options: EXRFixtureOptions = {}
): ArrayBuffer {
  const bytes: number[] = [];
  const integer = (value: number) => {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setInt32(0, value, true);
    bytes.push(...new Uint8Array(buffer));
  };
  const string = (text: string) => bytes.push(...new TextEncoder().encode(text), 0);
  const attribute = (name: string, type: string, data: readonly number[]) => {
    if (options.attributes && Object.hasOwn(options.attributes, name)) {
      const replacement = options.attributes[name];
      if (!replacement) return;
      type = replacement.type;
      data = replacement.data;
    }
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
  [-2, -1, (options.width ?? 4) - 3, -1].forEach((value, index) =>
    view.setInt32(index * 4, value, true)
  );
  attribute('dataWindow', 'box2i', Array.from(new Uint8Array(window)));
  attribute('displayWindow', 'box2i', Array.from(new Uint8Array(window)));
  attribute('lineOrder', 'lineOrder', [0]);
  attribute('pixelAspectRatio', 'float', [0, 0, 128, 63]);
  attribute('screenWindowCenter', 'v2f', [0, 0, 0, 0, 0, 0, 0, 0]);
  attribute('screenWindowWidth', 'float', [0, 0, 128, 63]);
  if (options.duplicateLineOrder) attribute('lineOrder', 'lineOrder', [0]);
  if (options.partType)
    attribute('type', 'string', Array.from(new TextEncoder().encode(options.partType)));
  bytes.push(0);
  const offset = bytes.length + 8;
  integer(options.chunkOffset ?? offset);
  integer(0);
  integer(options.chunkY ?? -1);
  integer(options.packedSize ?? payload.length);
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
  new DataView(buffer).setUint32(4, 0x01020304, true);
  const result = await EXRLoaderWithParser.parse(fixture(0, 0, new Uint8Array(buffer)));
  expect(result.channels[0].data).toBeInstanceOf(Uint32Array);
  expect(result.channels[0].data[0]).toBe(4294967295);
  expect(result.channels[0].data[1]).toBe(0x01020304);
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

/** Compresses fixed reference bytes with the platform's independent zlib writer. */
async function compressReference(bytes: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(bytes);
  return new Uint8Array(
    await new Response(
      new Blob([copy]).stream().pipeThrough(new CompressionStream('deflate'))
    ).arrayBuffer()
  );
}

test.each([
  1, 2, 3
])('EXR compression %s preserves nonzero byte planes and signed HDR samples', async method => {
  // Reference predictor bytes for HALF [-2, 0, 1, Infinity], repeated eight times.
  const predicted = Uint8Array.from([
    0,
    ...new Array(31).fill(128),
    64,
    192,
    188,
    192,
    ...Array.from({length: 7}, () => [196, 192, 188, 192]).flat()
  ]);
  const payload =
    method === 1
      ? Uint8Array.from([255, 0, 30, 128, 224, ...predicted.slice(32)])
      : await compressReference(predicted);
  const result = await EXRLoaderWithParser.parse(
    fixture(method, 1, payload, {width: 32, partType: 'scanlineimage'})
  );
  expect(Array.from(result.channels[0].data)).toEqual(
    Array.from({length: 8}, () => [-2, 0, 1, Infinity]).flat()
  );
  expect(result.attributes.type.type).toBe('string');
});

test('EXR FLOAT preserves nonzero little-endian values and a distinct display window', async () => {
  const payload = new ArrayBuffer(16);
  const view = new DataView(payload);
  [-0.5, 1.25, 100000, NaN].forEach((value, index) => view.setFloat32(index * 4, value, true));
  const result = await EXRLoaderWithParser.parse(
    fixture(0, 2, new Uint8Array(payload), {
      attributes: {
        displayWindow: {type: 'box2i', data: [0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 20, 0, 0, 0]}
      }
    })
  );
  expect(Array.from(result.channels[0].data)).toEqual([-0.5, 1.25, 100000, NaN]);
  expect(result.displayWindow).toEqual([0, 0, 10, 20]);
  expect(result.dataWindow).toEqual([-2, -1, 1, -1]);
});

test.each([
  ['missing data window', {attributes: {dataWindow: null}}, /window/],
  ['inverted window', {width: 0}, /inverted/],
  ['missing compression', {attributes: {compression: null}}, /compression/],
  ['invalid line order', {attributes: {lineOrder: {type: 'lineOrder', data: [3]}}}, /lineOrder/],
  ['unsupported part', {partType: 'deepscanline'}, /part type/],
  ['missing channels', {attributes: {channels: null}}, /channel list/],
  ['empty channels', {attributes: {channels: {type: 'chlist', data: [0]}}}, /channel list length/],
  ['duplicate attribute', {duplicateLineOrder: true}, /duplicate attribute/],
  ['chunk outside file', {chunkOffset: 999999}, /chunk offset/],
  ['chunk inside header', {chunkOffset: 0}, /overlaps header/],
  ['scanline outside window', {chunkY: 0}, /scanline index/],
  ['raw size mismatch', {packedSize: 7}, /uncompressed size/],
  ['oversized declared plane', {width: 64 * 1024 * 1024 + 1}, /size limit/]
] as const)('EXR rejects %s before returning partial data', async (_name, options, error) => {
  await expect(
    EXRLoaderWithParser.parse(fixture(0, 1, new Uint8Array(8), options))
  ).rejects.toThrow(error);
});

test('EXR rejects invalid magic, unterminated headers and unsupported channel types', async () => {
  await expect(EXRLoaderWithParser.parse(new ArrayBuffer(4))).rejects.toThrow(/magic/);
  await expect(
    EXRLoaderWithParser.parse(fixture(0, 1, new Uint8Array(8)).slice(0, 10))
  ).rejects.toThrow(/string/);
  await expect(EXRLoaderWithParser.parse(fixture(0, 3, new Uint8Array(8)))).rejects.toThrow(
    /channel/
  );
});

test.each([
  [[127, 0], /RLE exceeds/],
  [[0], /RLE run/],
  [[255], /RLE literals/],
  [[0, 0], /RLE size/]
] as const)('EXR rejects malformed RLE payload %#', async (bytes, error) => {
  await expect(EXRLoaderWithParser.parse(fixture(1, 1, new Uint8Array(bytes)))).rejects.toThrow(
    error
  );
});

test.each([
  [16, 1, /ZIP exceeds/],
  [8, 2, /ZIP size/]
] as const)('EXR bounds native zlib output for %s decoded bytes', async (length, pixelType, error) => {
  const reference = new Uint8Array(length).fill(128);
  reference[0] = 0;
  const payload = await compressReference(reference);
  await expect(EXRLoaderWithParser.parse(fixture(2, pixelType, payload))).rejects.toThrow(error);
});
