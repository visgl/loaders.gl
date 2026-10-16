// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TypedArray} from '@loaders.gl/loader-utils';
import {waitForPromiseWithSignal} from '@loaders.gl/loader-utils';
import {fromArrayBuffer} from 'geotiff';
import type {TiffNumericDecoder, TiffNumericImage} from './tiff-numeric-decoder';
import type {TiffSampleOptions} from './decode-tiff-samples';
import {selectTiffBands} from './plan-tiff-blocks';

/** Compatibility backend; only this adapter exposes the library to the numeric decoder boundary. */
export async function openGeoTIFFNumericDecoder(
  data: ArrayBuffer,
  signal?: AbortSignal
): Promise<TiffNumericDecoder> {
  signal?.throwIfAborted();
  const dataset = await waitForPromiseWithSignal(fromArrayBuffer(data, signal), signal);
  const imageCount = await waitForPromiseWithSignal(dataset.getImageCount(), signal);
  const images: TiffNumericImage[] = [];
  for (let index = 0; index < imageCount; index++) {
    signal?.throwIfAborted();
    const image = await waitForPromiseWithSignal(dataset.getImage(index), signal);
    const width = image.getWidth();
    const height = image.getHeight();
    const bandCount = image.getSamplesPerPixel();
    if (
      ![width, height, bandCount].every(value => Number.isSafeInteger(value) && value > 0) ||
      bandCount > 65535
    )
      throw new Error('Invalid TIFF image dimensions or band count');
    /** Applies the common output policy before compatibility decoder allocation. */
    const readSamples = async (options: TiffSampleOptions = {}) => {
      options.signal?.throwIfAborted();
      const bands = selectTiffBands(options.bands, bandCount);
      const window = options.window ?? [0, 0, width, height];
      if (
        window.length !== 4 ||
        !window.every(value => Number.isSafeInteger(value) && value >= 0) ||
        window[0] >= window[2] ||
        window[1] >= window[3] ||
        window[2] > width ||
        window[3] > height
      )
        throw new Error('Invalid TIFF native window');
      const outputWidth = window[2] - window[0];
      const outputHeight = window[3] - window[1];
      const pixelCount = outputWidth * outputHeight;
      const estimatedBytes =
        pixelCount *
        bands.reduce(
          (sum, band) =>
            sum +
            getCompatibilitySampleBytes(image.getSampleFormat(band), image.getBitsPerSample(band)),
          0
        );
      const maxPixels = options.maxPixels ?? 16_000_000;
      const maxBytes = options.maxDecodedBytes ?? 256 * 1024 * 1024;
      if (![maxPixels, maxBytes].every(value => Number.isSafeInteger(value) && value > 0))
        throw new Error('Invalid TIFF sample budgets');
      if (
        !Number.isSafeInteger(pixelCount) ||
        pixelCount > maxPixels ||
        !Number.isSafeInteger(estimatedBytes) ||
        estimatedBytes > maxBytes
      )
        throw new Error('TIFF decoded output budget exceeded');
      const result = await waitForPromiseWithSignal(
        image.readRasters({
          window: [...window],
          samples: bands,
          interleave: false,
          signal: options.signal
        }),
        options.signal
      );
      options.signal?.throwIfAborted();
      const arrays = result as unknown as TypedArray[];
      if (
        arrays.length !== bands.length ||
        result.width !== outputWidth ||
        result.height !== outputHeight ||
        arrays.some(array => !ArrayBuffer.isView(array) || array.length !== pixelCount) ||
        arrays.reduce((sum, array) => sum + array.byteLength, 0) > maxBytes
      )
        throw new Error('Invalid or oversized compatibility TIFF output');
      return {data: arrays, width: outputWidth, height: outputHeight};
    };
    images.push({
      width,
      height,
      bandCount,
      fileDirectory: {...image.getFileDirectory()},
      geoKeys: image.getGeoKeys() ?? null,
      metadata: image.getGDALMetadata() ?? null,
      noData: image.getGDALNoData() ?? null,
      bandMetadata: Array.from(
        {length: bandCount},
        (_, band) => image.getGDALMetadata(band) ?? null
      ),
      readSamples
    });
  }
  signal?.throwIfAborted();
  return {backend: 'geotiff', images};
}

/** Returns the compatibility backend's allocated sample width before decoding. */
function getCompatibilitySampleBytes(format: number, bits: number): number {
  if ((format === 1 || format === 2) && Number.isInteger(bits) && bits > 0 && bits <= 32)
    return bits <= 8 ? 1 : bits <= 16 ? 2 : 4;
  if (format === 3 && (bits === 16 || bits === 32 || bits === 64)) return bits === 64 ? 8 : 4;
  throw new Error('Unsupported compatibility TIFF sample representation');
}
