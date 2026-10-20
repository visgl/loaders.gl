// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ImageWriter} from '@loaders.gl/images';
import {
  rasterCoordinateToPixel,
  sampleRaster,
  waitForPromiseWithSignal
} from '@loaders.gl/core/loader-utils';
import type {
  NumericRasterData,
  RasterBoundingBox,
  RasterRegionSource
} from '@loaders.gl/core/loader-utils';
import {encodePMTiles} from './lib/encode-pmtiles';
import type {PMTilesEncodeOptions, PMTilesTile} from './pmtiles-writer-types';

/** Existing numeric region source; the exporter never takes ownership or finalizes it. */
export type RasterPMTilesSource = Pick<RasterRegionSource, 'getMetadata' | 'getRasterForRegion'>;

/** Bounded selected-tile PNG authoring from an existing georeferenced raster source. */
export type RasterPMTilesOptions = {
  /** Finite canonical XYZ selection; empty requests count against maxTiles. */
  readonly tiles:
    | Iterable<Pick<PMTilesTile, 'z' | 'x' | 'y'>>
    | AsyncIterable<Pick<PMTilesTile, 'z' | 'x' | 'y'>>;
  /** Square output tile width and height; default 256, maximum 1024. */
  readonly tileSize?: number;
  /** Source band indices in gray, gray/alpha, RGB or RGBA order; default all bands. */
  readonly bands?: readonly number[];
  /** Nonspatial source dimension selection, forwarded to region requests. */
  readonly selection?: Readonly<Record<string, number>>;
  /** Maximum returned region pixels, default 1,048,576. Also forwarded to the source. */
  readonly maxSourcePixels?: number;
  /** Budget for returned sample/mask buffers plus RGBA pixels, default 32 MiB. Forwarded to the source. */
  readonly maxDecodedBytes?: number;
  /** Archive budgets, cancellation, bounds, center and auxiliary metadata. */
  readonly pmtiles?: Omit<PMTilesEncodeOptions, 'tileType' | 'tileCompression'>;
};

/** Web Mercator half-world extent in meters (EPSG:3857). */
const HALF_WORLD = Math.PI * 6378137;

/**
 * Requests selected regions, samples byte-valued imagery into Web Mercator PNG tiles, and packages PMTiles v3.
 * Longitude/latitude inputs are sampled at Mercator pixel centers; other CRSs require prior reprojection.
 * Sampling uses raw bytes, validity masks and nodata. No styling or physical-value scaling is inferred.
 * PNG encoding uses ImageWriter (browser canvas, or the application's installed Node image polyfill).
 * Input region decoding, PNG encoding and archive allocation retain their own temporary allocations.
 */
export async function encodeRasterPMTiles(
  source: RasterPMTilesSource,
  options: RasterPMTilesOptions
): Promise<ArrayBuffer> {
  const configuration = {
    ...options,
    bands: options.bands?.slice(),
    selection: options.selection ? {...options.selection} : undefined,
    pmtiles: {...options.pmtiles}
  };
  const signal = configuration.pmtiles.signal;
  signal?.throwIfAborted();
  const tileSize = configuration.tileSize ?? 256;
  const maxSourcePixels = configuration.maxSourcePixels ?? 1024 * 1024;
  const maxDecodedBytes = configuration.maxDecodedBytes ?? 32 * 1024 * 1024;
  const maxTiles = configuration.pmtiles.maxTiles ?? 100000;
  if (
    !Number.isSafeInteger(tileSize) ||
    tileSize < 1 ||
    tileSize > 1024 ||
    !Number.isSafeInteger(maxSourcePixels) ||
    maxSourcePixels < tileSize * tileSize ||
    !Number.isSafeInteger(maxDecodedBytes) ||
    maxDecodedBytes < tileSize * tileSize * 4 ||
    !Number.isSafeInteger(maxTiles) ||
    maxTiles < 1
  )
    throw new Error('Invalid raster PMTiles size or budget');
  const metadata = await waitForPromiseWithSignal(source.getMetadata({signal}), signal);
  signal?.throwIfAborted();
  const sourceCRS = metadata.crs;
  if (sourceCRS !== 'EPSG:3857' && sourceCRS !== 'EPSG:4326' && sourceCRS !== 'OGC:CRS84')
    throw new Error('Raster PMTiles requires EPSG:3857, EPSG:4326 or OGC:CRS84');
  const crs = sourceCRS;
  if (!Number.isSafeInteger(metadata.bandCount) || metadata.bandCount < 1)
    throw new Error('Invalid raster source band count');
  const bands =
    configuration.bands ??
    Array.from({length: Math.min(metadata.bandCount, 5)}, (_, index) => index);
  if (
    ![1, 2, 3, 4].includes(bands.length) ||
    new Set(bands).size !== bands.length ||
    bands.some(band => !Number.isSafeInteger(band) || band < 0 || band >= metadata.bandCount)
  )
    throw new Error('Select one through four distinct raster bands');
  const sampleOptions = {bands: bands.map((_band, index) => index)};
  const archiveMetadata = {...configuration.pmtiles.metadata};
  for (const name of [
    'vector_layers',
    'bounds',
    'minzoom',
    'maxzoom',
    'center',
    'tiles',
    'tilestats'
  ])
    delete archiveMetadata[name];
  return encodePMTiles(encodeTiles(), {
    ...configuration.pmtiles,
    metadata: archiveMetadata,
    tileType: 'png',
    tileCompression: 'none'
  });

  /** Acquires one bounded region at a time and closes selection iterators on failure/abort. */
  async function* encodeTiles(): AsyncIterable<PMTilesTile> {
    const seen = new Set<string>();
    let requested = 0;
    for await (const address of configuration.tiles) {
      signal?.throwIfAborted();
      const tile = {...address};
      if (++requested > maxTiles) throw new Error('Raster PMTiles requested tile limit exceeded');
      if (
        !Number.isInteger(tile.z) ||
        tile.z < 0 ||
        tile.z > 26 ||
        !Number.isInteger(tile.x) ||
        !Number.isInteger(tile.y) ||
        tile.x < 0 ||
        tile.y < 0 ||
        tile.x >= 2 ** tile.z ||
        tile.y >= 2 ** tile.z
      )
        throw new Error('Invalid raster PMTiles selected XYZ address');
      const key = `${tile.z}/${tile.x}/${tile.y}`;
      if (seen.has(key)) throw new Error('Duplicate raster PMTiles selected XYZ address');
      seen.add(key);
      const scale = 2 ** tile.z;
      const west = tile.x / scale;
      const east = (tile.x + 1) / scale;
      const north = tile.y / scale;
      const south = (tile.y + 1) / scale;
      const bounds: RasterBoundingBox =
        crs === 'EPSG:3857'
          ? [
              [(2 * west - 1) * HALF_WORLD, (1 - 2 * south) * HALF_WORLD],
              [(2 * east - 1) * HALF_WORLD, (1 - 2 * north) * HALF_WORLD]
            ]
          : [
              [360 * west - 180, getLatitude(south)],
              [360 * east - 180, getLatitude(north)]
            ];
      const raster = await waitForPromiseWithSignal(
        source.getRasterForRegion({
          bounds,
          crs,
          width: tileSize,
          height: tileSize,
          bands: bands.slice(),
          selection: configuration.selection,
          interleaved: false,
          resampleMethod: 'nearest',
          maxPixels: maxSourcePixels,
          maxDecodedBytes,
          signal
        }),
        signal
      );
      signal?.throwIfAborted();
      validateRaster(raster, bands.length, tileSize, maxSourcePixels, maxDecodedBytes);
      const pixels = new Uint8Array(tileSize * tileSize * 4);
      let visible = false;
      const firstX = bounds[0][0] + (bounds[1][0] - bounds[0][0]) / (2 * tileSize);
      const lastX = bounds[1][0] - (bounds[1][0] - bounds[0][0]) / (2 * tileSize);
      for (let row = 0; row < tileSize; row++) {
        if (row % 32 === 0) {
          signal?.throwIfAborted();
          if (row) await new Promise<void>(resolve => setTimeout(resolve, 0));
          signal?.throwIfAborted();
        }
        const normalizedY = north + (row + 0.5) / (tileSize * scale);
        const sourceY =
          crs === 'EPSG:3857' ? (1 - 2 * normalizedY) * HALF_WORLD : getLatitude(normalizedY);
        const firstPixel = rasterCoordinateToPixel(raster, [firstX, sourceY], crs);
        const lastPixel = rasterCoordinateToPixel(raster, [lastX, sourceY], crs);
        for (let column = 0; column < tileSize; column++) {
          const fraction = tileSize === 1 ? 0 : column / (tileSize - 1);
          const sample = sampleRaster(
            raster,
            [
              firstPixel[0] + (lastPixel[0] - firstPixel[0]) * fraction,
              firstPixel[1] + (lastPixel[1] - firstPixel[1]) * fraction
            ],
            sampleOptions
          );
          if (!sample.valid.every(Boolean)) continue;
          const values = sample.values as number[];
          const offset = (row * tileSize + column) * 4;
          const grayscale = values.length < 3;
          pixels[offset] = values[0];
          pixels[offset + 1] = grayscale ? values[0] : values[1];
          pixels[offset + 2] = grayscale ? values[0] : values[2];
          pixels[offset + 3] =
            values.length === 2 ? values[1] : values.length === 4 ? values[3] : 255;
          visible ||= pixels[offset + 3] > 0;
        }
      }
      if (!visible) continue;
      const data = await waitForPromiseWithSignal(
        ImageWriter.encode(
          {data: pixels, width: tileSize, height: tileSize},
          {image: {mimeType: 'image/png'}}
        ),
        signal
      );
      signal?.throwIfAborted();
      yield {...tile, data};
    }
  }
}

/** Converts north-origin normalized Web Mercator Y to latitude in degrees. */
function getLatitude(normalizedY: number): number {
  return (Math.atan(Math.sinh(Math.PI * (1 - 2 * normalizedY))) * 180) / Math.PI;
}

/** Rejects unsupported imagery and bounds returned buffers before allocating RGBA output. */
function validateRaster(
  raster: NumericRasterData,
  bandCount: number,
  tileSize: number,
  maxPixels: number,
  maxBytes: number
): void {
  const pixels = raster.width * raster.height;
  if (
    !Number.isSafeInteger(raster.width) ||
    raster.width < 1 ||
    !Number.isSafeInteger(raster.height) ||
    raster.height < 1 ||
    !Number.isSafeInteger(pixels) ||
    pixels > maxPixels ||
    raster.bandCount !== bandCount ||
    raster.dtype !== 'uint8' ||
    (raster.bands && raster.bands.length !== bandCount) ||
    raster.bands?.some(
      band => band.dtype !== 'uint8' || (band.scale ?? 1) !== 1 || (band.offset ?? 0) !== 0
    )
  )
    throw new Error(
      'Raster PMTiles requires bounded raw uint8 imagery with matching selected bands'
    );
  const buffers = Array.isArray(raster.data) ? raster.data : [raster.data];
  const expectedLength = Array.isArray(raster.data) ? pixels : pixels * bandCount;
  if (
    (Array.isArray(raster.data) && buffers.length !== bandCount) ||
    buffers.some(
      buffer =>
        (!(buffer instanceof Uint8Array) && !(buffer instanceof Uint8ClampedArray)) ||
        buffer.length !== expectedLength
    )
  )
    throw new Error('Invalid raster PMTiles sample buffers');
  for (const mask of raster.validityMasks ?? []) {
    const offset = mask.offset ?? 0;
    const pixelStride = mask.pixelStride ?? 1;
    const rowStride = mask.rowStride ?? mask.width;
    if (
      !(mask.data instanceof Uint8Array) ||
      mask.width !== raster.width ||
      mask.height !== raster.height ||
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isSafeInteger(pixelStride) ||
      pixelStride < 1 ||
      !Number.isSafeInteger(rowStride) ||
      rowStride < 1 ||
      offset + (mask.height - 1) * rowStride + (mask.width - 1) * pixelStride >= mask.data.length ||
      (mask.band !== undefined &&
        (!Number.isInteger(mask.band) || mask.band < 0 || mask.band >= bandCount))
    )
      throw new Error('Invalid raster PMTiles validity mask');
  }
  const bytes =
    buffers.reduce((total, buffer) => total + buffer.byteLength, tileSize * tileSize * 4) +
    (raster.validityMasks ?? []).reduce((total, mask) => total + mask.data.byteLength, 0);
  if (bytes > maxBytes) throw new Error('Raster PMTiles decoded-byte budget exceeded');
}
