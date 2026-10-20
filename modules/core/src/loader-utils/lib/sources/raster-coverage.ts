// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumericRasterData, RasterRegionParameters} from './raster-source';

/** Identity and interpretation used to qualify accepted coverage reuse. */
export type RasterCoverageIdentity = {
  /** Borrowed source instance identity. */
  source: object;
  /** Source revision token. */
  revision?: unknown;
  /** Opaque authorization identity; never exported in raster provenance. */
  authorization?: unknown;
  /** Caller-defined nodata/scaling interpretation identity. */
  interpretation?: unknown;
  /** Caller-defined service parameter identity. */
  serviceParameters?: unknown;
};

/** Reuses one accepted axis-aligned payload only when identity, selection and both resolutions qualify. */
export function canReuseRasterCoverage(
  raster: NumericRasterData,
  accepted: RasterRegionParameters,
  candidate: RasterRegionParameters,
  acceptedIdentity: RasterCoverageIdentity,
  candidateIdentity: RasterCoverageIdentity,
  maximumStretch = 1
): boolean {
  if (!Number.isFinite(maximumStretch) || maximumStretch < 1) return false;
  for (const key of [
    'source',
    'revision',
    'authorization',
    'interpretation',
    'serviceParameters'
  ] as const) {
    if (acceptedIdentity[key] !== candidateIdentity[key]) return false;
  }
  if (
    accepted.crs !== candidate.crs ||
    raster.crs !== candidate.crs ||
    accepted.interleaved !== candidate.interleaved ||
    accepted.resampleMethod !== candidate.resampleMethod
  )
    return false;
  if (JSON.stringify(accepted.bands) !== JSON.stringify(candidate.bands)) return false;
  const selectionKeys = new Set([
    ...Object.keys(accepted.selection || {}),
    ...Object.keys(candidate.selection || {})
  ]);
  for (const key of selectionKeys)
    if (accepted.selection?.[key] !== candidate.selection?.[key]) return false;
  const bounds = raster.boundingBox;
  const resolution = raster.resolution;
  if (
    !bounds ||
    !resolution ||
    !raster.transform ||
    raster.transform[1] !== 0 ||
    raster.transform[3] !== 0
  )
    return false;
  if (
    !Number.isSafeInteger(candidate.width) ||
    !Number.isSafeInteger(candidate.height) ||
    candidate.width <= 0 ||
    candidate.height <= 0
  )
    return false;
  for (let axis = 0; axis < 2; axis++) {
    const minimum = candidate.bounds[0][axis];
    const maximum = candidate.bounds[1][axis];
    if (
      !Number.isFinite(minimum) ||
      !Number.isFinite(maximum) ||
      minimum >= maximum ||
      minimum < bounds[0][axis] ||
      maximum > bounds[1][axis]
    )
      return false;
    const requestedResolution =
      (maximum - minimum) / (axis === 0 ? candidate.width : candidate.height);
    if (
      !Number.isFinite(resolution[axis]) ||
      resolution[axis] <= 0 ||
      resolution[axis] > requestedResolution * maximumStretch
    )
      return false;
  }
  return true;
}
