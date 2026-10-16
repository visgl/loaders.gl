// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TiffDirectoryLimits} from './tiff-types';
import type {TiffSampleOptions, TiffSampleResult} from './decode-tiff-samples';
import {
  checkTiffEncoding,
  decodeTiffSamples,
  UnsupportedTiffEncodingError
} from './decode-tiff-samples';
import {readTiffContainer} from './read-tiff-directory';
import {getTiffDimension} from './plan-tiff-blocks';
import {readTiffMetadata} from './tiff-metadata';

/** Decoder-independent scientific image; implementation objects never escape this boundary. */
export type TiffNumericImage = {
  /** Original stored width. */
  readonly width: number;
  /** Original stored height. */
  readonly height: number;
  /** Original number of sample bands. */
  readonly bandCount: number;
  /** Decoded TIFF tag names and values, retaining raw georeferencing tags. */
  readonly fileDirectory: Record<string, unknown>;
  /** Declared GeoKeys, without guessed CRS definitions. */
  readonly geoKeys: Record<string, unknown> | null;
  /** Image-level GDAL metadata. */
  readonly metadata: Record<string, unknown> | null;
  /** Per-band GDAL metadata, kept separate from image metadata. */
  readonly bandMetadata: readonly (Record<string, unknown> | null)[];
  /** Raw-domain GDAL nodata declaration. */
  readonly noData: number | null;
  /** Reads owned, unscaled planar arrays through the selected backend. */
  readonly readSamples: (options?: TiffSampleOptions) => Promise<TiffSampleResult>;
};

/** Dataset contract used by the numeric loader, independent of TIFF implementation classes. */
export type TiffNumericDecoder = {
  /** Selected internal backend, available to qualification tests without changing public payloads. */
  readonly backend: 'native' | 'geotiff';
  /** Main-chain images in original file order; SubIFDs remain separate directory identities. */
  readonly images: readonly TiffNumericImage[];
};

/** Backend policy and metadata limits for an in-memory numeric TIFF. */
export type TiffNumericDecoderOptions = TiffDirectoryLimits & {
  /** Prefer the original core in auto mode; native forbids compatibility fallback. */
  readonly decoder?: 'auto' | 'native' | 'geotiff';
  /** Cancellation for opening and metadata interpretation. */
  readonly signal?: AbortSignal;
};

/** Opens the original core, falling back only for explicitly unsupported encoding or metadata features. */
export async function openTiffNumericDecoder(
  data: ArrayBuffer,
  options: TiffNumericDecoderOptions = {}
): Promise<TiffNumericDecoder> {
  options.signal?.throwIfAborted();
  const decoder = options.decoder ?? 'auto';
  if (!['auto', 'native', 'geotiff'].includes(decoder))
    throw new Error('Invalid TIFF decoder policy');
  // Every backend shares the original checked directory preflight. Malformed input and exhausted budgets never trigger fallback.
  const container = readTiffContainer(data, options);
  options.signal?.throwIfAborted();
  if (decoder !== 'geotiff') {
    try {
      const images = container.directories.map(directory => {
        checkTiffEncoding(directory);
        const metadata = readTiffMetadata(directory);
        return {
          ...metadata,
          width: getTiffDimension(directory, 256),
          height: getTiffDimension(directory, 257),
          bandCount: getTiffDimension(directory, 277, 1),
          readSamples: (parameters: TiffSampleOptions = {}) =>
            decodeTiffSamples(data, directory, container.littleEndian, parameters)
        };
      });
      return {backend: 'native', images};
    } catch (error) {
      if (decoder === 'native' || !(error instanceof UnsupportedTiffEncodingError)) throw error;
    }
  }
  const {openGeoTIFFNumericDecoder} = await import('./geotiff-decoder-adapter');
  return openGeoTIFFNumericDecoder(data, options.signal);
}
