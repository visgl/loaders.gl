// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, TypedArray} from '@loaders.gl/loader-utils';
import {openTiffNumericDecoder} from './lib/tiff/tiff-numeric-decoder';
import {GeoTIFFRasterLoader} from './geotiff-raster-loader-types';
import type {GeoTIFFRasterData, GeoTIFFRasterLoaderOptions} from './geotiff-raster-types';

const {preload: _preload, ...metadata} = GeoTIFFRasterLoader;

/** Parser-bearing numeric TIFF loader; import this subpath to bundle the implementation eagerly. */
export const GeoTIFFRasterLoaderWithParser = {
  ...metadata,
  parse: parseGeoTIFFRaster
} as const satisfies LoaderWithParser<GeoTIFFRasterData, never, GeoTIFFRasterLoaderOptions>;

/** Decodes complete native-resolution images without modifying sample values or interpreting grids. */
async function parseGeoTIFFRaster(
  data: ArrayBuffer,
  options?: GeoTIFFRasterLoaderOptions
): Promise<GeoTIFFRasterData> {
  const decoder = await openTiffNumericDecoder(data, {
    decoder: options?.geotiff?.decoder,
    ...options?.geotiff?.directoryLimits,
    signal: options?.geotiff?.signal
  });
  const imageIndices = selectIndices(
    options?.geotiff?.imageIndices,
    decoder.images.length,
    'imageIndices'
  );
  const images: GeoTIFFRasterData['images'] = [];
  for (const index of imageIndices) {
    const image = decoder.images[index];
    const samples = selectIndices(options?.geotiff?.bands, image.bandCount, 'bands');
    const rasters = await image.readSamples({
      bands: samples,
      maxPixels: options?.geotiff?.maxPixels,
      maxDecodedBytes: options?.geotiff?.maxDecodedBytes,
      signal: options?.geotiff?.signal
    });
    const bands = await Promise.all(
      samples.map(async (sample, position) => ({
        index: sample,
        data: rasters.data[position] as TypedArray,
        metadata: image.bandMetadata[sample] ?? null
      }))
    );
    const geoKeys: Record<string, unknown> | null = image.geoKeys;
    const code = geoKeys?.ProjectedCSTypeGeoKey ?? geoKeys?.GeographicTypeGeoKey;
    images.push({
      index,
      width: image.width,
      height: image.height,
      bands,
      geoKeys,
      metadata: image.metadata,
      noData: image.noData,
      fileDirectory: {...image.fileDirectory},
      ...(typeof code === 'number' && Number.isInteger(code) && code > 0 && code < 32767
        ? {crs: `EPSG:${code}` as const}
        : {})
    });
  }
  return {images};
}

/** Validates an optional selection and preserves original file/sample ordering. */
function selectIndices(
  selection: readonly number[] | undefined,
  count: number,
  name: string
): number[] {
  if (selection === undefined) return Array.from({length: count}, (_, index) => index);
  if (
    !Array.isArray(selection) ||
    selection.length === 0 ||
    new Set(selection).size !== selection.length ||
    !Array.from(selection).every(index => Number.isInteger(index) && index >= 0 && index < count)
  ) {
    throw new Error(`GeoTIFFRasterLoader: ${name} must contain unique valid indices`);
  }
  return [...selection].sort((left, right) => left - right);
}
