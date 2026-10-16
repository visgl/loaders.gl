// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {fromBlob, GeoTIFF} from 'geotiff';
import type {GeoTIFFImage} from 'geotiff';
import type {
  TiffByteSource,
  TiffSourceDecoder,
  TiffSourceDirectory,
  TiffSourceImage,
  TiffRasterReadResult
} from './tiff-source-decoder';

/** Opens the compatibility source behind a library-independent region decoder facade. */
export async function openGeoTIFFSourceDecoder(
  source: Blob | TiffByteSource,
  signal?: AbortSignal
): Promise<TiffSourceDecoder> {
  const dataset =
    source instanceof Blob
      ? await fromBlob(source, signal)
      : await GeoTIFF.fromSource(source, {cache: false}, signal);
  const originalImages = new WeakMap<TiffSourceImage, GeoTIFFImage>();
  const imageCache = new Map<number, TiffSourceImage>();
  return {
    getImageCount: () => dataset.getImageCount(),
    /** Wraps each image once; the original image is accessible only inside this adapter. */
    getImage: async (index: number) => {
      const cached = imageCache.get(index);
      if (cached) return cached;
      const original = await dataset.getImage(index);
      const image: TiffSourceImage = {
        fileDirectory: {
          ...original.fileDirectory,
          NewSubfileType: original.fileDirectory.NewSubfileType ?? 0
        } as TiffSourceDirectory,
        getWidth: () => original.getWidth(),
        getHeight: () => original.getHeight(),
        getSamplesPerPixel: () => original.getSamplesPerPixel(),
        getTileWidth: () => original.getTileWidth(),
        getTileHeight: () => original.getTileHeight(),
        getBitsPerSample: band => original.getBitsPerSample(band),
        getSampleFormat: band => original.getSampleFormat(band),
        getGeoKeys: () => original.getGeoKeys() ?? null,
        getGDALMetadata: band => original.getGDALMetadata(band) ?? null,
        getGDALNoData: () => original.getGDALNoData() ?? null,
        getBoundingBox: () => original.getBoundingBox(),
        getResolution: reference => original.getResolution(originalImages.get(reference)),
        getOrigin: () => original.getOrigin(),
        readRasters: async options =>
          (await original.readRasters(options)) as unknown as TiffRasterReadResult
      };
      imageCache.set(index, image);
      originalImages.set(image, original);
      return image;
    },
    readRasters: async options =>
      (await dataset.readRasters(options)) as unknown as TiffRasterReadResult,
    close: async () => {
      imageCache.clear();
      await dataset.close();
    }
  };
}
