// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CRSDefinition} from '@math.gl/crs';
import type {NumericRasterData, RasterBandStatistics} from './raster-source';

/** Options for synchronous sample-center-index sampling. */
export type RasterSampleOptions = {
  /** Payload band indices; defaults to all bands. */
  bands?: number[];
  /** Sampling method; bilinear requires every contributing neighbor valid. */
  method?: 'nearest' | 'bilinear';
  /** Raw samples by default; physical applies scale and offset once. */
  domain?: 'raw' | 'physical';
};

/** An explicit miss or values with per-band validity. */
export type RasterSample = {
  /** Whether the coordinate falls outside the payload. */
  miss: boolean;
  /** Invalid values are undefined. */
  values: (number | undefined)[];
  /** Validity in requested band order. */
  valid: boolean[];
  /** Original source band indices. */
  bands: number[];
  /** Displayed native overview. */
  overview?: number;
  /** Source provenance. */
  provenance?: NumericRasterData['provenance'];
};

/** Reads a raw sample without modifying the payload. */
function readRasterValue(
  raster: NumericRasterData,
  column: number,
  row: number,
  band: number
): number {
  const index = row * raster.width + column;
  if (Array.isArray(raster.data)) return Number(raster.data[band]?.[index]);
  return Number(
    raster.data[
      raster.interleaved
        ? index * raster.bandCount + band
        : band * raster.width * raster.height + index
    ]
  );
}

/** Evaluates masks, raw nodata and non-finite samples in the same order for every layout. */
export function isRasterSampleValid(
  raster: NumericRasterData,
  column: number,
  row: number,
  band: number
): boolean {
  if (
    !Number.isInteger(column) ||
    !Number.isInteger(row) ||
    column < 0 ||
    row < 0 ||
    column >= raster.width ||
    row >= raster.height ||
    !Number.isInteger(band) ||
    band < 0 ||
    band >= raster.bandCount
  )
    return false;
  const value = readRasterValue(raster, column, row, band);
  if (!Number.isFinite(value)) return false;
  const metadata = raster.bands?.[band];
  const noData = metadata?.noData === undefined ? raster.noData : metadata.noData;
  if (
    noData !== undefined &&
    noData !== null &&
    value === ((metadata?.dtype ?? raster.dtype) === 'float32' ? Math.fround(noData) : noData)
  )
    return false;
  return (raster.validityMasks || []).every(mask => {
    if (mask.band !== undefined && mask.band !== band) return true;
    if (column >= mask.width || row >= mask.height) return false;
    const index =
      (mask.offset ?? 0) + row * (mask.rowStride ?? mask.width) + column * (mask.pixelStride ?? 1);
    return (
      index >= 0 &&
      index < mask.data.length &&
      mask.data[index] !== undefined &&
      mask.data[index] !== 0
    );
  });
}

/** Samples fractional sample-center indices; bilinear never blends categorical bands. */
export function sampleRaster(
  raster: NumericRasterData,
  pixel: [number, number],
  options: RasterSampleOptions = {}
): RasterSample {
  const bands = options.bands ?? Array.from({length: raster.bandCount}, (_, index) => index);
  if (bands.some(band => !Number.isInteger(band) || band < 0 || band >= raster.bandCount))
    throw new Error('Invalid raster band index');
  const [column, row] = pixel;
  const nearestColumn = Math.floor(column + 0.5);
  const nearestRow = Math.floor(row + 0.5);
  const miss =
    !Number.isFinite(column) ||
    !Number.isFinite(row) ||
    nearestColumn < 0 ||
    nearestRow < 0 ||
    nearestColumn >= raster.width ||
    nearestRow >= raster.height;
  const values = bands.map(band => {
    if (miss) return undefined;
    let value = 0;
    const metadata = raster.bands?.[band];
    if (options.method !== 'bilinear' || metadata?.categorical) {
      if (!isRasterSampleValid(raster, nearestColumn, nearestRow, band)) return undefined;
      value = readRasterValue(raster, nearestColumn, nearestRow, band);
    } else {
      const left = Math.floor(column);
      const top = Math.floor(row);
      for (let vertical = 0; vertical < 2; vertical++) {
        for (let horizontal = 0; horizontal < 2; horizontal++) {
          const weight =
            (horizontal ? column - left : 1 - column + left) *
            (vertical ? row - top : 1 - row + top);
          if (weight === 0) continue;
          if (!isRasterSampleValid(raster, left + horizontal, top + vertical, band))
            return undefined;
          value += weight * readRasterValue(raster, left + horizontal, top + vertical, band);
        }
      }
    }
    const result =
      options.domain === 'physical'
        ? value * (metadata?.scale ?? 1) + (metadata?.offset ?? 0)
        : value;
    return Number.isFinite(result) ? result : undefined;
  });
  return {
    miss,
    values,
    valid: values.map(value => value !== undefined),
    bands: bands.map(band => raster.bands?.[band]?.index ?? band),
    overview: raster.overview,
    provenance: raster.provenance
  };
}

/** Inverts an explicit affine in the matching CRS, normalizing area registration to sample centers. */
export function rasterCoordinateToPixel(
  raster: NumericRasterData,
  coordinate: [number, number],
  crs: CRSDefinition
): [number, number] {
  if (!raster.crs || raster.crs !== crs)
    throw new Error('Raster coordinate CRS must match payload CRS');
  if (!raster.transform) throw new Error('Raster affine transform is unavailable');
  const [columnScale, rowShear, originX, columnShear, rowScale, originY] = raster.transform;
  const determinant = columnScale * rowScale - rowShear * columnShear;
  if (
    !raster.transform.every(Number.isFinite) ||
    !Number.isFinite(determinant) ||
    determinant === 0
  )
    throw new Error('Singular or invalid raster affine transform');
  const deltaX = coordinate[0] - originX;
  const deltaY = coordinate[1] - originY;
  const shift = raster.pixelRegistration === 'point' ? 0 : 0.5;
  return [
    (rowScale * deltaX - rowShear * deltaY) / determinant - shift + 0,
    (columnScale * deltaY - columnShear * deltaX) / determinant - shift + 0
  ];
}

/** Computes bounded deterministic statistics; sampled ranges are not exact extrema. */
export function computeRasterStatistics(
  raster: NumericRasterData,
  sampleBudget: number,
  domain: 'raw' | 'physical' = 'raw'
): RasterBandStatistics[] {
  if (!Number.isSafeInteger(sampleBudget) || sampleBudget <= 0)
    throw new Error('Statistics sample budget must be a positive integer');
  const pixelCount = raster.width * raster.height;
  const count = Math.min(pixelCount, sampleBudget);
  return Array.from({length: raster.bandCount}, (_, band) => {
    let minimumValue = Infinity;
    let maximumValue = -Infinity;
    let validCount = 0;
    for (let sample = 0; sample < count; sample++) {
      const index = Math.floor((sample * pixelCount) / count);
      const value = sampleRaster(raster, [index % raster.width, Math.floor(index / raster.width)], {
        bands: [band],
        domain
      }).values[0];
      if (value === undefined || !Number.isFinite(value)) continue;
      minimumValue = Math.min(minimumValue, value);
      maximumValue = Math.max(maximumValue, value);
      validCount++;
    }
    return {
      band: raster.bands?.[band]?.index ?? band,
      domain,
      min: validCount ? minimumValue : undefined,
      max: validCount ? maximumValue : undefined,
      validCount,
      scope: 'payload',
      method: count === pixelCount ? 'exact' : 'sampled'
    };
  });
}
