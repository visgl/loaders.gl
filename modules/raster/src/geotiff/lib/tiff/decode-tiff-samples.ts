// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TypedArray} from '@loaders.gl/loader-utils';
import type {TiffDirectory} from './tiff-types';
import {
  getTiffDimension,
  getTiffNumbers,
  planTiffBlocks,
  selectTiffBands
} from './plan-tiff-blocks';

/** Explicit support decision; unsupported encodings may use the compatibility decoder. */
export class UnsupportedTiffEncodingError extends Error {
  /** Records why the original decoder cannot interpret this encoding. */
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedTiffEncodingError';
  }
}

/** Native planar decoding result independent of any compatibility decoder objects. */
export type TiffSampleResult = {
  /** Selected raw arrays in requested original-band order. */
  readonly data: TypedArray[];
  /** Native window width. */
  readonly width: number;
  /** Native window height. */
  readonly height: number;
};

/** Bounds and cancellation for a native read; complete-image decoding uses the same path. */
export type TiffSampleOptions = {
  /** Native half-open pixel window; defaults to the complete image. */
  readonly window?: readonly number[];
  /** Original band indices; defaults to every band. */
  readonly bands?: readonly number[];
  /** Maximum output pixels; default 16 million. */
  readonly maxPixels?: number;
  /** Maximum output bytes; default 256 MiB. */
  readonly maxDecodedBytes?: number;
  /** Caller cancellation checked before allocation, each block, and cooperative yields. */
  readonly signal?: AbortSignal;
};

/** Checks that the original decoder supports stored samples without making a fallback decision on malformed data. */
export function checkTiffEncoding(directory: TiffDirectory): void {
  const compression = getTiffDimension(directory, 259, 1);
  const predictor = getTiffDimension(directory, 317, 1);
  const fillOrder = getTiffDimension(directory, 266, 1);
  const photometric = getTiffNumbers(directory, 262)[0];
  if (compression !== 1 || predictor !== 1 || fillOrder !== 1 || photometric === 6) {
    throw new UnsupportedTiffEncodingError(
      'TIFF compression, predictor, bit order or YCbCr packing requires the compatibility decoder'
    );
  }
  const bandCount = getTiffDimension(directory, 277, 1);
  const bits = getTiffNumbers(directory, 258, [1]);
  const formats = getTiffNumbers(directory, 339, [1]);
  for (let band = 0; band < bandCount; band++)
    createSampleArray(
      getBandValue(bits, band, bandCount),
      getBandValue(formats, band, bandCount),
      0
    );
}

/** Decodes uncompressed integer/float tiles and strips directly into owned planar arrays. */
export async function decodeTiffSamples(
  data: ArrayBuffer,
  directory: TiffDirectory,
  littleEndian: boolean,
  options: TiffSampleOptions = {}
): Promise<TiffSampleResult> {
  options.signal?.throwIfAborted();
  checkTiffEncoding(directory);
  const bandCount = getTiffDimension(directory, 277, 1);
  const bands = selectTiffBands(options.bands, bandCount);
  const window = options.window ?? [
    0,
    0,
    getTiffDimension(directory, 256),
    getTiffDimension(directory, 257)
  ];
  const blocks = planTiffBlocks(directory, data.byteLength, window, bands);
  const width = window[2] - window[0];
  const height = window[3] - window[1];
  const pixels = width * height;
  const bits = getTiffNumbers(directory, 258, [1]);
  const formats = getTiffNumbers(directory, 339, [1]);
  const bandBytes = Array.from(
    {length: bandCount},
    (_, band) => getBandValue(bits, band, bandCount) / 8
  );
  const byteLength = pixels * bands.reduce((sum, band) => sum + bandBytes[band], 0);
  const maxPixels = options.maxPixels ?? 16_000_000;
  const maxBytes = options.maxDecodedBytes ?? 256 * 1024 * 1024;
  if (![maxPixels, maxBytes].every(value => Number.isSafeInteger(value) && value > 0))
    throw new Error('Invalid TIFF sample budgets');
  if (
    !Number.isSafeInteger(pixels) ||
    pixels > maxPixels ||
    !Number.isSafeInteger(byteLength) ||
    byteLength > maxBytes
  )
    throw new Error('TIFF decoded output budget exceeded');
  // Stored block sizes are validated before output allocation; no decoder scratch buffers are created.
  const chunkyBytes = bandBytes.reduce((sum, value) => sum + value, 0);
  for (const block of blocks) {
    const expectedBytes =
      block.width * block.height * (block.band === undefined ? chunkyBytes : bandBytes[block.band]);
    if (!Number.isSafeInteger(expectedBytes) || expectedBytes !== block.byteLength)
      throw new Error('Invalid uncompressed TIFF block byte count');
  }
  options.signal?.throwIfAborted();
  const arrays = bands.map(band =>
    createSampleArray(
      getBandValue(bits, band, bandCount),
      getBandValue(formats, band, bandCount),
      pixels
    )
  );
  let sampleOffset = 0;
  const bandOffsets = bandBytes.map(byteLength => {
    const offset = sampleOffset;
    sampleOffset += byteLength;
    return offset;
  });
  const view = new DataView(data);
  let copiedValues = 0;
  for (const block of blocks) {
    options.signal?.throwIfAborted();
    const firstColumn = Math.max(window[0], block.column);
    const lastColumn = Math.min(window[2], block.column + block.width);
    const firstRow = Math.max(window[1], block.row);
    const lastRow = Math.min(window[3], block.row + block.height);
    for (let row = firstRow; row < lastRow; row++) {
      for (let column = firstColumn; column < lastColumn; column++) {
        const storedPixel = (row - block.row) * block.width + column - block.column;
        const outputPixel = (row - window[1]) * width + column - window[0];
        for (let position = 0; position < bands.length; position++) {
          const band = bands[position];
          if (block.band !== undefined && block.band !== band) continue;
          const offset =
            block.offset +
            storedPixel * (block.band === undefined ? chunkyBytes : bandBytes[band]) +
            (block.band === undefined ? bandOffsets[band] : 0);
          arrays[position][outputPixel] = readSample(
            view,
            offset,
            getBandValue(bits, band, bandCount),
            getBandValue(formats, band, bandCount),
            littleEndian
          );
          if (++copiedValues % 32768 === 0) {
            await new Promise<void>(resolve => setTimeout(resolve, 0));
            options.signal?.throwIfAborted();
          }
        }
      }
    }
  }
  options.signal?.throwIfAborted();
  return {data: arrays, width, height};
}

/** Reads a per-band tag, accepting the common scalar convention without accepting truncated arrays. */
function getBandValue(values: readonly number[], band: number, bandCount: number): number {
  if (values.length !== 1 && values.length !== bandCount)
    throw new Error('Invalid TIFF per-band tag length');
  return values[values.length === 1 ? 0 : band];
}

/** Allocates the precise original sample representation; unsupported types never widen silently. */
function createSampleArray(bits: number, format: number, length: number): TypedArray {
  if (format === 1) {
    if (bits === 8) return new Uint8Array(length);
    if (bits === 16) return new Uint16Array(length);
    if (bits === 32) return new Uint32Array(length);
  }
  if (format === 2) {
    if (bits === 8) return new Int8Array(length);
    if (bits === 16) return new Int16Array(length);
    if (bits === 32) return new Int32Array(length);
  }
  if (format === 3) {
    if (bits === 32) return new Float32Array(length);
    if (bits === 64) return new Float64Array(length);
  }
  throw new UnsupportedTiffEncodingError(
    'TIFF sample representation requires the compatibility decoder'
  );
}

/** Reads one stored sample with explicit TIFF byte order. */
function readSample(
  view: DataView,
  offset: number,
  bits: number,
  format: number,
  littleEndian: boolean
): number {
  if (format === 3)
    return bits === 32
      ? view.getFloat32(offset, littleEndian)
      : view.getFloat64(offset, littleEndian);
  if (format === 2) {
    if (bits === 8) return view.getInt8(offset);
    return bits === 16 ? view.getInt16(offset, littleEndian) : view.getInt32(offset, littleEndian);
  }
  if (bits === 8) return view.getUint8(offset);
  return bits === 16 ? view.getUint16(offset, littleEndian) : view.getUint32(offset, littleEndian);
}
