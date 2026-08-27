// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GL_RGBA32F} from '../../../src/lib/gl-extensions';
import {isHDR, parseHDR} from '../../../src/lib/parsers/parse-hdr';
test('parseHDR#parses Radiance RLE data', () => {
  const texture = parseHDR(createRLEHDRBuffer('#?RADIANCE'));
  const level = texture.data[0];
  const data = level.data as Float32Array;
  expect(texture.shape, 'returns a texture payload').toBe('texture');
  expect(texture.type, 'returns a 2d texture').toBe('2d');
  expect(texture.data.length, 'returns a single texture level').toBe(1);
  expect(level.width, 'width is parsed').toBe(8);
  expect(level.height, 'height is parsed').toBe(2);
  expect(level.textureFormat, 'texture format is set').toBe('rgba32float');
  expect(level.format, 'WebGL format is set').toBe(GL_RGBA32F);
  expect(level.data instanceof Float32Array, 'pixel data is float32').toBeTruthy();
  expect(data[0], 'first pixel red is decoded from RGBE').toBe(2);
  expect(data[3], 'alpha is synthesized').toBe(1);
});
test('parseHDR#parses application-facing metadata', () => {
  const texture = parseHDR(
    createFlatHDRBuffer('#?RADIANCE', [
      'EXPOSURE=2',
      'GAMMA=1.8',
      'COLORCORR=1 0.5 2',
      'PIXASPECT=1.5',
      'PRIMARIES=0.64 0.33 0.29 0.6 0.15 0.06 0.333 0.333',
      'SOFTWARE=unit-test',
      'VIEW=-vtv 0 0 1 0 1 0 45 45'
    ])
  );
  expect(texture.metadata, 'returns application-facing metadata').toEqual({
    exposure: 2,
    gamma: 1.8,
    colorCorrection: [1, 0.5, 2],
    pixelAspectRatio: 1.5,
    primaries: [0.64, 0.33, 0.29, 0.6, 0.15, 0.06, 0.333, 0.333],
    software: 'unit-test',
    view: '-vtv 0 0 1 0 1 0 45 45'
  });
});
test('parseHDR#parses RGBE flat data', () => {
  const texture = parseHDR(createFlatHDRBuffer('#?RGBE'));
  const data = texture.data[0].data as Float32Array;
  expect(texture.data[0].width, 'width is parsed').toBe(2);
  expect(texture.data[0].height, 'height is parsed').toBe(1);
  expect(Math.abs(data[0] - 128 * (2 / 255)) < 1e-6, 'flat red channel is decoded').toBeTruthy();
  expect(Math.abs(data[1] - 64 * (2 / 255)) < 1e-6, 'flat green channel is decoded').toBeTruthy();
  expect(Math.abs(data[2] - 32 * (2 / 255)) < 1e-6, 'flat blue channel is decoded').toBeTruthy();
  expect(data[3], 'flat alpha is synthesized').toBe(1);
  expect(data[7], 'second flat pixel alpha is synthesized').toBe(1);
});
test('parseHDR#detects valid headers', () => {
  expect(isHDR(createRLEHDRBuffer('#?RADIANCE')), 'detects RADIANCE magic header').toBeTruthy();
  expect(isHDR(createFlatHDRBuffer('#?RGBE')), 'detects RGBE magic header').toBeTruthy();
  expect(
    isHDR(asArrayBuffer(Uint8Array.from([0, 1, 2, 3]))),
    'rejects non-HDR payloads'
  ).toBeFalsy();
});
test('parseHDR#rejects missing format specifier', () => {
  const buffer = createHeaderBuffer(['#?RADIANCE', '', '-Y 1 +X 1']);
  expect(() => parseHDR(buffer), 'requires format specifier').toThrow(/missing format specifier/);
});
test('parseHDR#rejects bad scanline data', () => {
  const bytes = new Uint8Array(createRLEHDRBuffer('#?RADIANCE'));
  bytes[bytes.length - 2] = 0;
  const buffer = asArrayBuffer(bytes);
  expect(() => parseHDR(buffer), 'rejects malformed scanline runs').toThrow(/bad scanline data/);
});
test('parseHDR#falls back to flat decode on false RLE probe', () => {
  const texture = parseHDR(createFlatFalseRLEProbeHDRBuffer());
  const data = texture.data[0].data as Float32Array;
  expect(texture.data[0].width, 'width is parsed for flat scanlines').toBe(8);
  expect(texture.data[0].height, 'height is parsed for flat scanlines').toBe(1);
  expect(
    Math.abs(data[0] - 4 / 255) < 1e-6,
    'first pixel red is decoded from flat data'
  ).toBeTruthy();
  expect(
    Math.abs(data[1] - 4 / 255) < 1e-6,
    'first pixel green is decoded from flat data'
  ).toBeTruthy();
  expect(
    Math.abs(data[2] - 14 / 255) < 1e-6,
    'first pixel blue is decoded from flat data'
  ).toBeTruthy();
  expect(data[3], 'first pixel alpha is synthesized').toBe(1);
});
test('parseHDR#accepts flipped Radiance resolution strings', () => {
  const texture = parseHDR(createOrientedFlatHDRBuffer('+Y 2 +X 2'));
  const data = texture.data[0].data as Float32Array;
  expect(texture.data[0].width, 'width is parsed for +Y +X').toBe(2);
  expect(texture.data[0].height, 'height is parsed for +Y +X').toBe(2);
  expect(
    Math.abs(data[0] - 1) < 1e-6,
    'top-left pixel is normalized into standard order'
  ).toBeTruthy();
  expect(
    Math.abs(data[4] - 254 / 255) < 1e-6,
    'top-right pixel is normalized into standard order'
  ).toBeTruthy();
  expect(
    Math.abs(data[8] - 253 / 255) < 1e-6,
    'bottom-left pixel is normalized into standard order'
  ).toBeTruthy();
  expect(
    Math.abs(data[12] - 252 / 255) < 1e-6,
    'bottom-right pixel is normalized into standard order'
  ).toBeTruthy();
});
test('parseHDR#accepts rotated Radiance resolution strings', () => {
  const texture = parseHDR(createOrientedFlatHDRBuffer('+X 2 -Y 2'));
  const data = texture.data[0].data as Float32Array;
  expect(texture.data[0].width, 'width is parsed for +X -Y').toBe(2);
  expect(texture.data[0].height, 'height is parsed for +X -Y').toBe(2);
  expect(Math.abs(data[0] - 1) < 1e-6, 'top-left pixel is normalized after rotation').toBeTruthy();
  expect(
    Math.abs(data[4] - 254 / 255) < 1e-6,
    'top-right pixel is normalized after rotation'
  ).toBeTruthy();
  expect(
    Math.abs(data[8] - 253 / 255) < 1e-6,
    'bottom-left pixel is normalized after rotation'
  ).toBeTruthy();
  expect(
    Math.abs(data[12] - 252 / 255) < 1e-6,
    'bottom-right pixel is normalized after rotation'
  ).toBeTruthy();
});
function createRLEHDRBuffer(magicHeader: '#?RADIANCE' | '#?RGBE'): ArrayBuffer {
  const header = createHeaderBuffer([magicHeader, 'FORMAT=32-bit_rle_rgbe', '', '-Y 2 +X 8']);
  const row1 = new Uint8Array([2, 2, 0, 8, 136, 255, 136, 0, 136, 0, 136, 129]);
  const row2 = new Uint8Array([2, 2, 0, 8, 8, 0, 1, 2, 3, 4, 5, 6, 7, 136, 10, 136, 20, 136, 128]);
  return joinBuffers(new Uint8Array(header), row1, row2);
}
function createFlatHDRBuffer(
  magicHeader: '#?RADIANCE' | '#?RGBE',
  metadataLines: string[] = []
): ArrayBuffer {
  const header = createHeaderBuffer([
    magicHeader,
    ...metadataLines,
    'FORMAT=32-bit_rle_rgbe',
    '',
    '-Y 1 +X 2'
  ]);
  const pixels = new Uint8Array([128, 64, 32, 129, 0, 0, 0, 0]);
  return joinBuffers(new Uint8Array(header), pixels);
}
function createOrientedFlatHDRBuffer(resolution: string): ArrayBuffer {
  const header = createHeaderBuffer(['#?RADIANCE', 'FORMAT=32-bit_rle_rgbe', '', resolution]);
  let redChannelValues: number[];
  switch (resolution) {
    case '+Y 2 +X 2':
      redChannelValues = [253, 252, 255, 254];
      break;
    case '+X 2 -Y 2':
      redChannelValues = [255, 253, 254, 252];
      break;
    default:
      throw new Error(`Unhandled test resolution: ${resolution}`);
  }
  const pixels = new Uint8Array(redChannelValues.flatMap(red => [red, 0, 0, 128]));
  return joinBuffers(new Uint8Array(header), pixels);
}
function createFlatFalseRLEProbeHDRBuffer(): ArrayBuffer {
  const header = createHeaderBuffer(['#?RADIANCE', 'FORMAT=32-bit_rle_rgbe', '', '-Y 1 +X 8']);
  const pixels = new Uint8Array([
    2, 2, 7, 129, 1, 0, 0, 128, 2, 0, 0, 128, 3, 0, 0, 128, 4, 0, 0, 128, 5, 0, 0, 128, 6, 0, 0,
    128, 7, 0, 0, 128
  ]);
  return joinBuffers(new Uint8Array(header), pixels);
}
function createHeaderBuffer(lines: string[]): ArrayBuffer {
  const header = `${lines.join('\n')}\n`;
  const bytes = new Uint8Array(header.length);
  for (let index = 0; index < header.length; index++) {
    bytes[index] = header.charCodeAt(index);
  }
  return asArrayBuffer(bytes);
}
function joinBuffers(...chunks: Uint8Array[]): ArrayBuffer {
  let length = 0;
  for (const chunk of chunks) {
    length += chunk.length;
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return asArrayBuffer(result);
}
function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
