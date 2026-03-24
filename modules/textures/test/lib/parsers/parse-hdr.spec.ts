// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {GL_RGBA32F} from '../../../src/lib/gl-extensions';
import {isHDR, parseHDR} from '../../../src/lib/parsers/parse-hdr';

test('parseHDR#parses Radiance RLE data', (t) => {
  const texture = parseHDR(createRLEHDRBuffer('#?RADIANCE'));
  const level = texture.data[0];
  const data = level.data as Float32Array;

  t.equal(texture.shape, 'texture', 'returns a texture payload');
  t.equal(texture.type, '2d', 'returns a 2d texture');
  t.equal(texture.data.length, 1, 'returns a single texture level');
  t.equal(level.width, 8, 'width is parsed');
  t.equal(level.height, 2, 'height is parsed');
  t.equal(level.textureFormat, 'rgba32float', 'texture format is set');
  t.equal(level.format, GL_RGBA32F, 'WebGL format is set');
  t.ok(level.data instanceof Float32Array, 'pixel data is float32');
  t.equal(data[0], 2, 'first pixel red is decoded from RGBE');
  t.equal(data[3], 1, 'alpha is synthesized');
  t.end();
});

test('parseHDR#parses RGBE flat data', (t) => {
  const texture = parseHDR(createFlatHDRBuffer('#?RGBE'));
  const data = texture.data[0].data as Float32Array;

  t.equal(texture.data[0].width, 2, 'width is parsed');
  t.equal(texture.data[0].height, 1, 'height is parsed');
  t.ok(Math.abs(data[0] - 128 * (2 / 255)) < 1e-6, 'flat red channel is decoded');
  t.ok(Math.abs(data[1] - 64 * (2 / 255)) < 1e-6, 'flat green channel is decoded');
  t.ok(Math.abs(data[2] - 32 * (2 / 255)) < 1e-6, 'flat blue channel is decoded');
  t.equal(data[3], 1, 'flat alpha is synthesized');
  t.equal(data[7], 1, 'second flat pixel alpha is synthesized');
  t.end();
});

test('parseHDR#detects valid headers', (t) => {
  t.ok(isHDR(createRLEHDRBuffer('#?RADIANCE')), 'detects RADIANCE magic header');
  t.ok(isHDR(createFlatHDRBuffer('#?RGBE')), 'detects RGBE magic header');
  t.notOk(isHDR(asArrayBuffer(Uint8Array.from([0, 1, 2, 3]))), 'rejects non-HDR payloads');
  t.end();
});

test('parseHDR#rejects missing format specifier', (t) => {
  const buffer = createHeaderBuffer(['#?RADIANCE', '', '-Y 1 +X 1']);
  t.throws(() => parseHDR(buffer), /missing format specifier/, 'requires format specifier');
  t.end();
});

test('parseHDR#rejects bad scanline data', (t) => {
  const bytes = new Uint8Array(createRLEHDRBuffer('#?RADIANCE'));
  bytes[bytes.length - 2] = 0;
  const buffer = asArrayBuffer(bytes);

  t.throws(() => parseHDR(buffer), /bad scanline data/, 'rejects malformed scanline runs');
  t.end();
});

test('parseHDR#falls back to flat decode on false RLE probe', (t) => {
  const texture = parseHDR(createFlatFalseRLEProbeHDRBuffer());
  const data = texture.data[0].data as Float32Array;

  t.equal(texture.data[0].width, 8, 'width is parsed for flat scanlines');
  t.equal(texture.data[0].height, 1, 'height is parsed for flat scanlines');
  t.ok(Math.abs(data[0] - 4 / 255) < 1e-6, 'first pixel red is decoded from flat data');
  t.ok(Math.abs(data[1] - 4 / 255) < 1e-6, 'first pixel green is decoded from flat data');
  t.ok(Math.abs(data[2] - 14 / 255) < 1e-6, 'first pixel blue is decoded from flat data');
  t.equal(data[3], 1, 'first pixel alpha is synthesized');
  t.end();
});

test('parseHDR#accepts flipped Radiance resolution strings', (t) => {
  const texture = parseHDR(createOrientedFlatHDRBuffer('+Y 2 +X 2'));
  const data = texture.data[0].data as Float32Array;

  t.equal(texture.data[0].width, 2, 'width is parsed for +Y +X');
  t.equal(texture.data[0].height, 2, 'height is parsed for +Y +X');
  t.ok(Math.abs(data[0] - 1) < 1e-6, 'top-left pixel is normalized into standard order');
  t.ok(Math.abs(data[4] - 254 / 255) < 1e-6, 'top-right pixel is normalized into standard order');
  t.ok(Math.abs(data[8] - 253 / 255) < 1e-6, 'bottom-left pixel is normalized into standard order');
  t.ok(
    Math.abs(data[12] - 252 / 255) < 1e-6,
    'bottom-right pixel is normalized into standard order'
  );
  t.end();
});

test('parseHDR#accepts rotated Radiance resolution strings', (t) => {
  const texture = parseHDR(createOrientedFlatHDRBuffer('+X 2 -Y 2'));
  const data = texture.data[0].data as Float32Array;

  t.equal(texture.data[0].width, 2, 'width is parsed for +X -Y');
  t.equal(texture.data[0].height, 2, 'height is parsed for +X -Y');
  t.ok(Math.abs(data[0] - 1) < 1e-6, 'top-left pixel is normalized after rotation');
  t.ok(Math.abs(data[4] - 254 / 255) < 1e-6, 'top-right pixel is normalized after rotation');
  t.ok(Math.abs(data[8] - 253 / 255) < 1e-6, 'bottom-left pixel is normalized after rotation');
  t.ok(Math.abs(data[12] - 252 / 255) < 1e-6, 'bottom-right pixel is normalized after rotation');
  t.end();
});

function createRLEHDRBuffer(magicHeader: '#?RADIANCE' | '#?RGBE'): ArrayBuffer {
  const header = createHeaderBuffer([magicHeader, 'FORMAT=32-bit_rle_rgbe', '', '-Y 2 +X 8']);
  const row1 = new Uint8Array([2, 2, 0, 8, 136, 255, 136, 0, 136, 0, 136, 129]);
  const row2 = new Uint8Array([2, 2, 0, 8, 8, 0, 1, 2, 3, 4, 5, 6, 7, 136, 10, 136, 20, 136, 128]);

  return joinBuffers(new Uint8Array(header), row1, row2);
}

function createFlatHDRBuffer(magicHeader: '#?RADIANCE' | '#?RGBE'): ArrayBuffer {
  const header = createHeaderBuffer([magicHeader, 'FORMAT=32-bit_rle_rgbe', '', '-Y 1 +X 2']);
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

  const pixels = new Uint8Array(redChannelValues.flatMap((red) => [red, 0, 0, 128]));

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
