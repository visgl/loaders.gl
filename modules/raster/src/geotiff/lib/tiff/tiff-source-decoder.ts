// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TypedArray} from '@loaders.gl/loader-utils';

/** TIFF-standard tags consumed by the region pipeline, independent of library directory classes. */
export type TiffSourceDirectory = Readonly<Record<string, unknown>> & {
  /** TIFF reduced-image and transparency-mask flags; absent flags normalize to zero. */
  readonly NewSubfileType: number;
  /** Legacy reduced-image designation. */
  readonly SubfileType?: number;
  /** Chunky or separate-plane storage. */
  readonly PlanarConfiguration?: number;
  /** Stored color-space or palette designation. */
  readonly PhotometricInterpretation?: number;
  /** Explicit source-coordinate matrix. */
  readonly ModelTransformation?: ArrayLike<number>;
  /** Raster/source tiepoint pairs. */
  readonly ModelTiepoint?: ArrayLike<number>;
  /** Source-unit pixel spacing. */
  readonly ModelPixelScale?: ArrayLike<number>;
};

/** Native read parameters shared with compatibility source adapters. */
export type TiffRasterReadOptions = {
  /** Half-open native pixel window. */
  window?: number[];
  /** Legacy source-coordinate bounding rectangle. */
  bbox?: number[];
  /** Requested sample width for legacy decoder resampling. */
  width?: number;
  /** Requested sample height for legacy decoder resampling. */
  height?: number;
  /** Original sample indices. */
  samples?: number[];
  /** Whether the decoder packs selected samples together. */
  interleave?: boolean;
  /** Legacy decoder resampling algorithm. */
  resampleMethod?: 'nearest' | 'bilinear';
  /** Legacy out-of-window fill value. */
  fillValue?: number;
  /** Cancellation for the underlying decode and range transport. */
  signal?: AbortSignal;
};

/** Native planar or packed arrays with explicit dimensions. */
export type TiffRasterReadResult = (TypedArray | TypedArray[]) & {
  /** Returned sample width. */
  width: number;
  /** Returned sample height. */
  height: number;
};

/** Portable image interface used by the existing region pipeline; no library types are exposed. */
export interface TiffSourceImage {
  /** Plain TIFF-standard directory values required by the region reader. */
  readonly fileDirectory: TiffSourceDirectory;
  /** Returns the original stored width. */
  getWidth(): number;
  /** Returns the original stored height. */
  getHeight(): number;
  /** Returns the original sample count. */
  getSamplesPerPixel(): number;
  /** Returns physical block width. */
  getTileWidth(): number;
  /** Returns physical block height. */
  getTileHeight(): number;
  /** Returns one original band's stored bit depth. */
  getBitsPerSample(band: number): number;
  /** Returns one original band's numeric representation. */
  getSampleFormat(band: number): number;
  /** Returns declared GeoKeys without guessing missing georeferencing. */
  getGeoKeys(): Record<string, unknown> | null;
  /** Returns image-level or original-band GDAL metadata. */
  getGDALMetadata(band?: number): Record<string, unknown> | null;
  /** Returns the raw-domain GDAL nodata declaration. */
  getGDALNoData(): number | null;
  /** Returns the explicit source-coordinate extent, or throws when unavailable. */
  getBoundingBox(): number[];
  /** Returns the signed source resolution, using a reference for an untagged overview. */
  getResolution(reference: TiffSourceImage): number[];
  /** Returns the declared source origin, or throws when unavailable. */
  getOrigin(): number[];
  /** Decodes raw stored samples; region interpretation and resampling remain consumer responsibilities. */
  readRasters(options: TiffRasterReadOptions): Promise<TiffRasterReadResult>;
}

/** Portable dataset facade; source orchestration never retains geotiff.js objects. */
export interface TiffSourceDecoder {
  /** Counts main-chain image directories. */
  getImageCount(): Promise<number>;
  /** Returns an image through the internal TIFF contract. */
  getImage(index: number): Promise<TiffSourceImage>;
  /** Preserves the legacy dataset-level read used by older consumers. */
  readRasters(options: TiffRasterReadOptions): Promise<TiffRasterReadResult>;
  /** Releases resources owned by the dataset. */
  close(): Promise<void>;
}

/** Byte-source protocol owned by loaders.gl transport, not by any TIFF implementation. */
export type TiffByteSource = {
  /** Fetches exact standalone buffers in requested range order. */
  fetch: (
    slices: {offset: number; length: number}[],
    signal?: AbortSignal
  ) => Promise<ArrayBuffer[]>;
  /** Validated file length when discovered by transport. */
  readonly fileSize?: number | null;
  /** Releases this source's owned resources. */
  close: () => void;
};
