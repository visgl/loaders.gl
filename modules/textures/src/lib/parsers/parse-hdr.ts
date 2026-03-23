// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureLevel} from '@loaders.gl/schema';
import {GL_RGBA32F} from '../gl-extensions';

const HDR_MAGIC_HEADERS = ['#?RADIANCE', '#?RGBE'];
const HDR_FORMAT = '32-bit_rle_rgbe';

type HeaderState = {
  data: Uint8Array;
  offset: number;
};

type HDRHeader = {
  width: number;
  height: number;
};

export function isHDR(arrayBuffer: ArrayBuffer): boolean {
  const state: HeaderState = {
    data: new Uint8Array(arrayBuffer),
    offset: 0
  };

  const firstLine = readLine(state);
  return firstLine ? HDR_MAGIC_HEADERS.includes(firstLine) : false;
}

export function parseHDR(arrayBuffer: ArrayBuffer): TextureLevel[] {
  const state: HeaderState = {
    data: new Uint8Array(arrayBuffer),
    offset: 0
  };
  const {width, height} = readHeader(state);
  const rgbeData = readPixels(state, width, height);
  const data = convertRGBEToFloat(rgbeData);

  return [
    {
      shape: 'texture-level',
      compressed: false,
      width,
      height,
      data,
      levelSize: data.byteLength,
      format: GL_RGBA32F,
      textureFormat: 'rgba32float'
    }
  ];
}

function readHeader(state: HeaderState): HDRHeader {
  const magicHeader = readLine(state);
  if (!magicHeader || !HDR_MAGIC_HEADERS.includes(magicHeader)) {
    throw new Error('HDRLoader: bad initial token');
  }

  let hasFormat = false;

  while (state.offset < state.data.length) {
    const line = readLine(state);

    if (line === null) {
      break;
    }

    if (!line || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('FORMAT=')) {
      hasFormat = line.slice('FORMAT='.length) === HDR_FORMAT;
      if (!hasFormat) {
        throw new Error('HDRLoader: unsupported format specifier');
      }
      continue;
    }

    const dimensions = parseDimensions(line);
    if (dimensions) {
      if (!hasFormat) {
        throw new Error('HDRLoader: missing format specifier');
      }
      return dimensions;
    }
  }

  if (!hasFormat) {
    throw new Error('HDRLoader: missing format specifier');
  }

  throw new Error('HDRLoader: missing image size specifier');
}

function parseDimensions(line: string): HDRHeader | null {
  const match = line.match(/^-Y\s+(\d+)\s+\+X\s+(\d+)$/);
  if (!match) {
    return null;
  }

  const height = Number(match[1]);
  const width = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('HDRLoader: invalid image dimensions');
  }

  return {width, height};
}

function readPixels(state: HeaderState, width: number, height: number): Uint8Array {
  const pixelCount = width * height;
  const flatByteLength = pixelCount * 4;

  if (width < 8 || width > 0x7fff) {
    return readFlatPixels(state, flatByteLength);
  }

  if (state.offset + 4 > state.data.length) {
    throw new Error('HDRLoader: unexpected end of file');
  }

  const data = state.data;
  const isRunLengthEncoded =
    data[state.offset] === 2 && data[state.offset + 1] === 2 && !(data[state.offset + 2] & 0x80);

  if (!isRunLengthEncoded) {
    return readFlatPixels(state, flatByteLength);
  }

  const scanlineWidth = (data[state.offset + 2] << 8) | data[state.offset + 3];
  if (scanlineWidth !== width) {
    throw new Error('HDRLoader: wrong scanline width');
  }

  const pixels = new Uint8Array(flatByteLength);
  const scanlineBuffer = new Uint8Array(width * 4);
  let outputOffset = 0;

  for (let scanlineIndex = 0; scanlineIndex < height; scanlineIndex++) {
    if (state.offset + 4 > data.length) {
      throw new Error('HDRLoader: unexpected end of file');
    }

    const red = data[state.offset++];
    const green = data[state.offset++];
    const blue = data[state.offset++];
    const exponent = data[state.offset++];

    if (red !== 2 || green !== 2 || ((blue << 8) | exponent) !== width) {
      throw new Error('HDRLoader: bad rgbe scanline format');
    }

    for (let channelIndex = 0; channelIndex < 4; channelIndex++) {
      const channelOffset = channelIndex * width;
      const channelEnd = channelOffset + width;
      let pixelOffset = channelOffset;

      while (pixelOffset < channelEnd) {
        if (state.offset >= data.length) {
          throw new Error('HDRLoader: unexpected end of file');
        }

        let count = data[state.offset++];

        if (count > 128) {
          count -= 128;
          if (count === 0 || pixelOffset + count > channelEnd || state.offset >= data.length) {
            throw new Error('HDRLoader: bad scanline data');
          }

          const value = data[state.offset++];
          scanlineBuffer.fill(value, pixelOffset, pixelOffset + count);
          pixelOffset += count;
          continue;
        }

        if (count === 0 || pixelOffset + count > channelEnd || state.offset + count > data.length) {
          throw new Error('HDRLoader: bad scanline data');
        }

        scanlineBuffer.set(data.subarray(state.offset, state.offset + count), pixelOffset);
        pixelOffset += count;
        state.offset += count;
      }
    }

    for (let pixelIndex = 0; pixelIndex < width; pixelIndex++) {
      pixels[outputOffset++] = scanlineBuffer[pixelIndex];
      pixels[outputOffset++] = scanlineBuffer[pixelIndex + width];
      pixels[outputOffset++] = scanlineBuffer[pixelIndex + width * 2];
      pixels[outputOffset++] = scanlineBuffer[pixelIndex + width * 3];
    }
  }

  return pixels;
}

function readFlatPixels(state: HeaderState, byteLength: number): Uint8Array {
  if (state.offset + byteLength > state.data.length) {
    throw new Error('HDRLoader: unexpected end of file');
  }

  const pixels = state.data.slice(state.offset, state.offset + byteLength);
  state.offset += byteLength;
  return pixels;
}

function convertRGBEToFloat(data: Uint8Array): Float32Array {
  const floatData = new Float32Array(data.length);

  for (let sourceOffset = 0; sourceOffset < data.length; sourceOffset += 4) {
    const exponent = data[sourceOffset + 3];
    const destinationOffset = sourceOffset;

    if (exponent > 0) {
      const scale = Math.pow(2, exponent - 128) / 255;
      floatData[destinationOffset] = data[sourceOffset] * scale;
      floatData[destinationOffset + 1] = data[sourceOffset + 1] * scale;
      floatData[destinationOffset + 2] = data[sourceOffset + 2] * scale;
    }

    floatData[destinationOffset + 3] = 1;
  }

  return floatData;
}

function readLine(state: HeaderState): string | null {
  if (state.offset >= state.data.length) {
    return null;
  }

  const lineStart = state.offset;

  while (state.offset < state.data.length) {
    const byte = state.data[state.offset++];
    if (byte === 0x0a) {
      const line = decodeASCII(state.data.subarray(lineStart, state.offset - 1));
      return line.endsWith('\r') ? line.slice(0, -1) : line;
    }
  }

  const line = decodeASCII(state.data.subarray(lineStart, state.offset));
  return line.endsWith('\r') ? line.slice(0, -1) : line;
}

function decodeASCII(data: Uint8Array): string {
  let line = '';
  for (const byte of data) {
    line += String.fromCharCode(byte);
  }
  return line;
}
