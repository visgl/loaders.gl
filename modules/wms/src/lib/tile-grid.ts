// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getServiceCRSMetersPerUnit} from '../crs-utils';

export {
  createTileGrid,
  createTileGridMatrix,
  getRequestedTileMatrix,
  getTileGridMatrixId
} from '@loaders.gl/loader-utils';
export type {TileMatrixFields} from '@loaders.gl/loader-utils';

/** OGC standardized rendering pixel size, used to convert scale denominators: 0.28 mm. */
export const OGC_PIXEL_SIZE_METERS = 0.00028;

/**
 * Returns the length of one CRS unit in meters. Built-in units always win; the caller's value
 * applies only to other CRSs. Without either, the result is undefined, so no resolution is guessed.
 */
export function getMetersPerUnit(
  crs: string | undefined,
  metersPerUnit: number | null | undefined
): number | undefined {
  return getServiceCRSMetersPerUnit(crs) ?? metersPerUnit ?? undefined;
}

/** Converts an OGC scale denominator to CRS units per pixel, or undefined when it cannot. */
export function getScaleDenominatorResolution(
  scaleDenominator: number | undefined,
  metersPerUnit: number | undefined
): number | undefined {
  return metersPerUnit && Number.isFinite(scaleDenominator) && scaleDenominator! > 0
    ? (scaleDenominator! * OGC_PIXEL_SIZE_METERS) / metersPerUnit
    : undefined;
}

/** Rejects a `metersPerUnit` option that is set but not a positive finite number. */
export function validateMetersPerUnit(
  metersPerUnit: number | null | undefined,
  serviceName: string
): void {
  if (metersPerUnit === undefined || metersPerUnit === null) return;
  if (!Number.isFinite(metersPerUnit) || metersPerUnit <= 0)
    throw new RangeError(`${serviceName} metersPerUnit must be a positive finite number`);
}
