// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture, TextureLevel} from '@loaders.gl/schema';
import {GL_RGBA32F} from '../gl-extensions';

const HDR_MAGIC_HEADERS = ['#?RADIANCE', '#?RGBE'];
const HDR_FORMAT = '32-bit_rle_rgbe';

/** Application-facing metadata extracted from Radiance HDR header fields. */
export type RadianceHDRMetadata = {
  /** Per-channel color correction factors from the `COLORCORR` header field. */
  colorCorrection?: [number, number, number];
  /** Scene exposure multiplier from the `EXPOSURE` header field. */
  exposure?: number;
  /** Display gamma hint from the `GAMMA` header field. */
  gamma?: number;
  /** Pixel aspect ratio from the `PIXASPECT` header field. */
  pixelAspectRatio?: number;
  /** Chromaticity primaries and white point from the `PRIMARIES` header field. */
  primaries?: [number, number, number, number, number, number, number, number];
  /** Producer software identifier from the `SOFTWARE` header field. */
  software?: string;
  /** View specification string from the `VIEW` header field. */
  view?: string;
};

type HeaderState = {
  data: Uint8Array;
  offset: number;
};

type HDRHeader = {
  width: number;
  height: number;
  majorAxis: 'X' | 'Y';
  majorSign: 1 | -1;
  minorAxis: 'X' | 'Y';
  minorSign: 1 | -1;
  metadata?: RadianceHDRMetadata;
};

export function isHDR(arrayBuffer: ArrayBuffer): boolean {
  const state: HeaderState = {
    data: new Uint8Array(arrayBuffer),
    offset: 0
  };

  const firstLine = readLine(state);
  return firstLine ? HDR_MAGIC_HEADERS.includes(firstLine) : false;
}

export function parseHDR(arrayBuffer: ArrayBuffer): Texture<RadianceHDRMetadata> {
  const state: HeaderState = {
    data: new Uint8Array(arrayBuffer),
    offset: 0
  };
  const header = readHeader(state);
  const {width, height} = header;
  const rgbeData = readPixels(state, header);
  const data = convertRGBEToFloat(rgbeData);
  const level: TextureLevel = {
    shape: 'texture-level',
    compressed: false,
    width,
    height,
    data,
    levelSize: data.byteLength,
    format: GL_RGBA32F,
    textureFormat: 'rgba32float'
  };

  return {
    shape: 'texture',
    type: '2d',
    format: 'rgba32float',
    ...(header.metadata ? {metadata: header.metadata} : {}),
    data: [level]
  };
}

function readHeader(state: HeaderState): HDRHeader {
  const magicHeader = readLine(state);
  if (!magicHeader || !HDR_MAGIC_HEADERS.includes(magicHeader)) {
    throw new Error('RadianceHDRLoader: bad initial token');
  }

  let hasFormat = false;
  const metadata: RadianceHDRMetadata = {};

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
        throw new Error('RadianceHDRLoader: unsupported format specifier');
      }
      continue;
    }

    parseMetadataLine(metadata, line);

    const dimensions = parseDimensions(line);
    if (dimensions) {
      if (!hasFormat) {
        throw new Error('RadianceHDRLoader: missing format specifier');
      }
      return {
        ...dimensions,
        ...(hasMetadata(metadata) ? {metadata} : {})
      };
    }
  }

  if (!hasFormat) {
    throw new Error('RadianceHDRLoader: missing format specifier');
  }

  throw new Error('RadianceHDRLoader: missing image size specifier');
}

function parseDimensions(line: string): HDRHeader | null {
  const match = line.match(/^([+-])([YX])\s+(\d+)\s+([+-])([YX])\s+(\d+)$/);
  if (!match) {
    return null;
  }

  const majorSign = match[1] === '+' ? 1 : -1;
  const majorAxis = match[2] as 'X' | 'Y';
  const majorLength = Number(match[3]);
  const minorSign = match[4] === '+' ? 1 : -1;
  const minorAxis = match[5] as 'X' | 'Y';
  const minorLength = Number(match[6]);

  if (majorAxis === minorAxis) {
    throw new Error('RadianceHDRLoader: invalid image dimensions');
  }

  const width = majorAxis === 'X' ? majorLength : minorLength;
  const height = majorAxis === 'Y' ? majorLength : minorLength;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('RadianceHDRLoader: invalid image dimensions');
  }

  return {width, height, majorAxis, majorSign, minorAxis, minorSign};
}

function readPixels(state: HeaderState, header: HDRHeader): Uint8Array {
  const {width, height} = header;
  const pixelCount = width * height;
  const flatByteLength = pixelCount * 4;
  const scanlineLength = header.minorAxis === 'X' ? width : height;
  const scanlineCount = header.majorAxis === 'Y' ? height : width;

  if (scanlineLength < 8 || scanlineLength > 0x7fff) {
    return reorderPixels(readFlatPixels(state, flatByteLength), header);
  }

  if (state.offset + 4 > state.data.length) {
    throw new Error('RadianceHDRLoader: unexpected end of file');
  }

  const data = state.data;
  const isRunLengthEncoded =
    data[state.offset] === 2 && data[state.offset + 1] === 2 && !(data[state.offset + 2] & 0x80);

  if (!isRunLengthEncoded) {
    return reorderPixels(readFlatPixels(state, flatByteLength), header);
  }

  const scanlineWidth = (data[state.offset + 2] << 8) | data[state.offset + 3];
  if (scanlineWidth !== scanlineLength) {
    return reorderPixels(readFlatPixels(state, flatByteLength), header);
  }

  const pixels = new Uint8Array(flatByteLength);
  const scanlineBuffer = new Uint8Array(scanlineLength * 4);

  for (let scanlineIndex = 0; scanlineIndex < scanlineCount; scanlineIndex++) {
    if (state.offset + 4 > data.length) {
      throw new Error('RadianceHDRLoader: unexpected end of file');
    }

    const red = data[state.offset++];
    const green = data[state.offset++];
    const blue = data[state.offset++];
    const exponent = data[state.offset++];

    if (red !== 2 || green !== 2 || ((blue << 8) | exponent) !== scanlineLength) {
      throw new Error('RadianceHDRLoader: bad rgbe scanline format');
    }

    for (let channelIndex = 0; channelIndex < 4; channelIndex++) {
      const channelOffset = channelIndex * scanlineLength;
      const channelEnd = channelOffset + scanlineLength;
      let pixelOffset = channelOffset;

      while (pixelOffset < channelEnd) {
        if (state.offset >= data.length) {
          throw new Error('RadianceHDRLoader: unexpected end of file');
        }

        let count = data[state.offset++];

        if (count > 128) {
          count -= 128;
          if (count === 0 || pixelOffset + count > channelEnd || state.offset >= data.length) {
            throw new Error('RadianceHDRLoader: bad scanline data');
          }

          const value = data[state.offset++];
          scanlineBuffer.fill(value, pixelOffset, pixelOffset + count);
          pixelOffset += count;
          continue;
        }

        if (count === 0 || pixelOffset + count > channelEnd || state.offset + count > data.length) {
          throw new Error('RadianceHDRLoader: bad scanline data');
        }

        scanlineBuffer.set(data.subarray(state.offset, state.offset + count), pixelOffset);
        pixelOffset += count;
        state.offset += count;
      }
    }

    for (let pixelIndex = 0; pixelIndex < scanlineLength; pixelIndex++) {
      const outputOffset = getOutputOffset(header, scanlineIndex, pixelIndex);
      pixels[outputOffset] = scanlineBuffer[pixelIndex];
      pixels[outputOffset + 1] = scanlineBuffer[pixelIndex + scanlineLength];
      pixels[outputOffset + 2] = scanlineBuffer[pixelIndex + scanlineLength * 2];
      pixels[outputOffset + 3] = scanlineBuffer[pixelIndex + scanlineLength * 3];
    }
  }

  return pixels;
}

function reorderPixels(data: Uint8Array, header: HDRHeader): Uint8Array {
  const pixels = new Uint8Array(data.length);
  const scanlineLength = header.minorAxis === 'X' ? header.width : header.height;
  const scanlineCount = header.majorAxis === 'Y' ? header.height : header.width;

  for (let scanlineIndex = 0; scanlineIndex < scanlineCount; scanlineIndex++) {
    for (let pixelIndex = 0; pixelIndex < scanlineLength; pixelIndex++) {
      const sourceOffset = (scanlineIndex * scanlineLength + pixelIndex) * 4;
      const outputOffset = getOutputOffset(header, scanlineIndex, pixelIndex);
      pixels[outputOffset] = data[sourceOffset];
      pixels[outputOffset + 1] = data[sourceOffset + 1];
      pixels[outputOffset + 2] = data[sourceOffset + 2];
      pixels[outputOffset + 3] = data[sourceOffset + 3];
    }
  }

  return pixels;
}

function getOutputOffset(header: HDRHeader, scanlineIndex: number, pixelIndex: number): number {
  const majorCoordinate = getCoordinate(
    header.majorAxis === 'X' ? header.width : header.height,
    header.majorSign,
    scanlineIndex
  );
  const minorCoordinate = getCoordinate(
    header.minorAxis === 'X' ? header.width : header.height,
    header.minorSign,
    pixelIndex
  );
  const x = header.majorAxis === 'X' ? majorCoordinate : minorCoordinate;
  const y = header.majorAxis === 'Y' ? majorCoordinate : minorCoordinate;

  return ((header.height - 1 - y) * header.width + x) * 4;
}

function getCoordinate(length: number, sign: 1 | -1, index: number): number {
  return sign === 1 ? index : length - 1 - index;
}

function readFlatPixels(state: HeaderState, byteLength: number): Uint8Array {
  if (state.offset + byteLength > state.data.length) {
    throw new Error('RadianceHDRLoader: unexpected end of file');
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

function parseMetadataLine(metadata: RadianceHDRMetadata, line: string): void {
  if (line.startsWith('COLORCORR=')) {
    const values = parseNumberList(line.slice('COLORCORR='.length), 3);
    if (values) {
      metadata.colorCorrection = values as [number, number, number];
    }
    return;
  }

  if (line.startsWith('EXPOSURE=')) {
    const value = parseNumber(line.slice('EXPOSURE='.length));
    if (value !== null) {
      metadata.exposure = value;
    }
    return;
  }

  if (line.startsWith('GAMMA=')) {
    const value = parseNumber(line.slice('GAMMA='.length));
    if (value !== null) {
      metadata.gamma = value;
    }
    return;
  }

  if (line.startsWith('PIXASPECT=')) {
    const value = parseNumber(line.slice('PIXASPECT='.length));
    if (value !== null) {
      metadata.pixelAspectRatio = value;
    }
    return;
  }

  if (line.startsWith('PRIMARIES=')) {
    const values = parseNumberList(line.slice('PRIMARIES='.length), 8);
    if (values) {
      metadata.primaries = values as [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ];
    }
    return;
  }

  if (line.startsWith('SOFTWARE=')) {
    metadata.software = line.slice('SOFTWARE='.length).trim();
    return;
  }

  if (line.startsWith('VIEW=')) {
    metadata.view = line.slice('VIEW='.length).trim();
  }
}

function parseNumber(text: string): number | null {
  const value = Number(text.trim());
  return Number.isFinite(value) ? value : null;
}

function parseNumberList(text: string, count: number): number[] | null {
  const values = text
    .trim()
    .split(/\s+/)
    .map((value) => Number(value));

  if (values.length !== count || values.some((value) => !Number.isFinite(value))) {
    return null;
  }

  return values;
}

function hasMetadata(metadata: RadianceHDRMetadata): boolean {
  return Object.keys(metadata).length > 0;
}
