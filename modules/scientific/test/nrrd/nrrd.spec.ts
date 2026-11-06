// SPDX-License-Identifier: MIT
import {test, expect} from 'vitest';
import {NRRDLoaderWithParser} from '../../src/nrrd-loader';
const header =
  'NRRD0005\ntype: short\ndimension: 3\nsizes: 2 1 1\nencoding: raw\nendian: big\nspace origin: (10,20,30)\nspace directions: (1,0,0) (0,-2,0) (0,0,3)\nkinds: domain domain domain\ncustom:=value\n\n';
/** Concatenates an attached header and tiny binary payload. */
function attach(text: string, payload: Uint8Array): ArrayBuffer {
  const encoded = new TextEncoder().encode(text);
  const result = new Uint8Array(encoded.length + payload.length);
  result.set(encoded);
  result.set(payload, encoded.length);
  return result.buffer;
}
test('NRRD preserves signed endian values, shape and orientation', async () => {
  const result = await NRRDLoaderWithParser.parse(
    attach(header, new Uint8Array([0xff, 0xfe, 0, 3]))
  );
  expect(Array.from(result.data)).toEqual([-2, 3]);
  expect(result.data).toBeInstanceOf(Int16Array);
  expect(result.shape).toEqual([2, 1, 1]);
  expect(result.origin).toEqual([10, 20, 30]);
  expect(result.directions).toEqual([
    [1, 0, 0],
    [0, -2, 0],
    [0, 0, 3]
  ]);
  expect(result.metadata.custom).toBe('value');
});
test('NRRD gzip uses declared decoded length', async () => {
  const compressed = await new Response(
    new Blob([new Uint8Array([0xff, 0xfe, 0, 3])])
      .stream()
      .pipeThrough(new CompressionStream('gzip'))
  ).arrayBuffer();
  const result = await NRRDLoaderWithParser.parse(
    attach(header.replace('encoding: raw', 'encoding: gzip'), new Uint8Array(compressed))
  );
  expect(Array.from(result.data)).toEqual([-2, 3]);
  await expect(
    NRRDLoaderWithParser.parse(
      attach(
        header.replace('sizes: 2 1 1', 'sizes: 1 1 1').replace('encoding: raw', 'encoding: gzip'),
        new Uint8Array(compressed)
      )
    )
  ).rejects.toThrow(/declared size/);
});
test('NRRD ASCII retains float64 precision and nonspatial axis', async () => {
  const result = await NRRDLoaderWithParser.parse(
    new TextEncoder().encode(
      'NRRD0005\ntype: double\ndimension: 1\nsizes: 2\nencoding: ascii\nspace directions: none\n\n1.123456789 2'
    ).buffer
  );
  expect(result.data).toBeInstanceOf(Float64Array);
  expect(result.data[0]).toBe(1.123456789);
  expect(result.directions).toEqual([null]);
});
test.each([
  header.replace('sizes: 2 1 1', 'sizes: 999999999 1 1'),
  header.replace('encoding: raw', 'encoding: hex'),
  header.replace('endian: big', 'endian: invalid'),
  header.replace('encoding: raw', 'data file: other.raw\nencoding: raw'),
  header
])('NRRD rejects unsupported or malformed input %#', async input => {
  await expect(NRRDLoaderWithParser.parse(attach(input, new Uint8Array(1)))).rejects.toThrow(
    /NRRD/
  );
});

test.each([
  ['int8', [128], -128, Int8Array],
  ['uint8', [255], 255, Uint8Array],
  ['int16', [0, 128], -32768, Int16Array],
  ['uint16', [255, 255], 65535, Uint16Array],
  ['int32', [0, 0, 0, 128], -2147483648, Int32Array],
  ['uint32', [255, 255, 255, 255], 4294967295, Uint32Array],
  ['float', [0, 0, 160, 63], 1.25, Float32Array],
  ['double', [0, 0, 0, 0, 0, 0, 242, 63], 1.125, Float64Array]
] as const)('NRRD decodes boundary scalar %s without narrowing', async (type, bytes, value, constructor) => {
  const source = `NRRD0005\ntype: ${type}\ndimension: 1\nsizes: 1\nencoding: raw\nendian: little\n\n`;
  const result = await NRRDLoaderWithParser.parse(attach(source, new Uint8Array(bytes)));
  expect(result.data).toBeInstanceOf(constructor);
  expect(result.data[0]).toBe(value);
});

test('NRRD metadata preloads through core without interpreting axis values', async () => {
  const {parse} = await import('@loaders.gl/core');
  const {NRRDLoader} = await import('../../src/nrrd-loader-types');
  const result = await parse(attach(header, new Uint8Array([0xff, 0xfe, 0, 3])), NRRDLoader);
  expect(result.shape).toEqual([2, 1, 1]);
});

test.each([
  'NRRD0000\ntype: uchar\ndimension: 1\nsizes: 1\nencoding: raw\n\n',
  'NRRD0005\nmalformed\n\n',
  'NRRD0005\ntype: uchar\ntype: uchar\n\n',
  'NRRD0005\ntype: block\ndimension: 1\nsizes: 1\nencoding: raw\n\n',
  'NRRD0005\ntype: uchar\ndimension: 0\nsizes: 1\nencoding: raw\n\n',
  'NRRD0005\ntype: uchar\ndimension: 1\nsizes: 2\nencoding: ascii\n\n1',
  'NRRD0005\ntype: uchar\ndimension: 1\nsizes: 1\nencoding: ascii\n\nNaN',
  'NRRD0005\ntype: uchar\ndimension: 1\nsizes: 1\nencoding: ascii\n\n256',
  'NRRD0005\ntype: float\ndimension: 1\nsizes: 1\nencoding: ascii\nspace origin: (1,NaN,3)\n\n1',
  'NRRD0005\ntype: float\ndimension: 1\nsizes: 1\nencoding: ascii\nspace origin: (1,2\n\n1',
  'NRRD0005\ntype: float\ndimension: 1\nsizes: 1\nencoding: ascii\nspace dimension: 3\nspace directions: (1,2)\n\n1',
  'NRRD0005\ntype: float\ndimension: 1\nsizes: 1\nencoding: ascii\nspace directions: none none\n\n1',
  'NRRD0005\ntype: float\ndimension: 1\nsizes: 1\nencoding: ascii\nkinds: domain domain\n\n1'
])('NRRD rejects malformed headers and mismatched scalar/spatial metadata %#', async text => {
  await expect(NRRDLoaderWithParser.parse(new TextEncoder().encode(text).buffer)).rejects.toThrow(
    /NRRD/
  );
});

test('NRRD accepts CRLF headers and case-insensitive endian descriptors', async () => {
  const source =
    'NRRD0005\r\ntype: short\r\ndimension: 1\r\nsizes: 1\r\nencoding: raw\r\nendian: BIG\r\n\r\n';
  const result = await NRRDLoaderWithParser.parse(attach(source, new Uint8Array([0, 7])));
  expect(result.data[0]).toBe(7);
});

test('NRRD preserves long whitespace-padded header values with linear field scanning', async () => {
  const source =
    'NRRD0005\ntype: uchar\ndimension: 1\nsizes: 1\nencoding: ascii\ncontent:' +
    ' '.repeat(10000) +
    'sample\n\n7';
  const result = await NRRDLoaderWithParser.parse(new TextEncoder().encode(source).buffer);
  expect(result.fields.content).toBe('sample');
  expect(result.data[0]).toBe(7);
});

test('NRRD rejects empty spatial components instead of silently converting them to zero', async () => {
  const source =
    'NRRD0005\ntype: uchar\ndimension: 1\nsizes: 1\nencoding: ascii\nspace origin: (,0,0)\n\n7';
  await expect(NRRDLoaderWithParser.parse(new TextEncoder().encode(source).buffer)).rejects.toThrow(
    /empty spatial/
  );
});

test.each([
  'byte skip',
  'byteskip',
  'line skip',
  'lineskip'
])('NRRD handles zero and nonzero %s directives consistently', async name => {
  const prefix = 'NRRD0005\ntype: uchar\ndimension: 1\nsizes: 1\nencoding: raw\n';
  await expect(
    NRRDLoaderWithParser.parse(attach(`${prefix}${name}: 1\n\n`, new Uint8Array([7])))
  ).rejects.toThrow(/skip directives/);
  const result = await NRRDLoaderWithParser.parse(
    attach(`${prefix}${name}: 0\n\n`, new Uint8Array([7]))
  );
  expect(result.data[0]).toBe(7);
});
