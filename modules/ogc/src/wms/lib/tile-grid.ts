// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getServiceCRSMetersPerUnit} from '../crs-utils';

export {
  createTileGrid,
  createTileGridMatrix,
  getRequestedTileMatrix,
  getTileGridMatrixId
} from '@loaders.gl/core/loader-utils';
export type {TileMatrixFields} from '@loaders.gl/core/loader-utils';

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

/**
 * Converts an OGC scale denominator to CRS units per pixel. The result is undefined for an absent
 * scale, and for a valid scale in a CRS whose unit is unknown. A scale that is not positive and
 * finite gives a resolution that is not positive and finite either (NaN when the unit is unknown),
 * so that grid validation reports the level as invalid, not as missing its resolution.
 */
export function getScaleDenominatorResolution(
  scaleDenominator: number | undefined,
  metersPerUnit: number | undefined
): number | undefined {
  if (scaleDenominator === undefined) return undefined;
  if (metersPerUnit) return (scaleDenominator * OGC_PIXEL_SIZE_METERS) / metersPerUnit;
  return Number.isFinite(scaleDenominator) && scaleDenominator > 0 ? undefined : NaN;
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
