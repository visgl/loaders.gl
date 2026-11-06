// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {IESProfile} from './parse-ies';

/** Samples a snapshotted Type C distribution in candela, using angles in degrees. */
export type IESSampler = (verticalAngle: number, horizontalAngle: number) => number;

/** Options for a regular, renderer-independent angular grid. */
export type IESResampleOptions = {
  /** Samples from vertical 0 through 180 degrees, including both endpoints; default 181. */
  verticalCount?: number;
  /** Horizontal samples around [0, 360), excluding the duplicate seam; default 360. */
  horizontalCount?: number;
  /** Preserve candela or divide by the measured peak; default none. */
  normalization?: 'none' | 'peak';
};

/** Regular angular samples without texture objects or renderer coordinate transforms. */
export type IESGrid = {
  /** Vertical samples per row. */
  readonly width: number;
  /** Horizontal rows. */
  readonly height: number;
  /** Row-major intensity samples, vertical angle varying fastest. */
  readonly data: Float64Array;
  /** Vertical sample coordinates in degrees. */
  readonly verticalAngles: Float64Array;
  /** Horizontal sample coordinates in degrees. */
  readonly horizontalAngles: Float64Array;
  /** Physical candela or peak-relative values. */
  readonly unit: 'candela' | 'relative';
  /** Measured peak in candela, before optional normalization. */
  readonly peakCandela: number;
};

/** Internal immutable snapshot of the measured distribution. */
type PreparedIESProfile = {
  /** Measured vertical angles. */
  verticalAngles: Float64Array;
  /** Measured horizontal angles. */
  horizontalAngles: Float64Array;
  /** Scaled candela values. */
  values: Float64Array;
  /** Measured horizontal extent, or zero for rotational symmetry. */
  horizontalSpan: number;
  /** Largest scaled intensity. */
  peak: number;
};
const DEGREES_TO_RADIANS = Math.PI / 180;
const MAX_GRID_SAMPLES = 4_194_304;

/** Creates a reusable bilinear sampler; later mutations of the source profile have no effect. */
export function createIESSampler(profile: IESProfile): IESSampler {
  const prepared = prepareIESProfile(profile);
  return (verticalAngle, horizontalAngle) => {
    if (
      !Number.isFinite(verticalAngle) ||
      verticalAngle < 0 ||
      verticalAngle > 180 ||
      !Number.isFinite(horizontalAngle)
    ) {
      throw new Error(
        'IES: sampling requires a vertical angle in [0, 180] and finite horizontal angle'
      );
    }
    return samplePreparedProfile(prepared, verticalAngle, horizontalAngle);
  };
}

/** Integrates the piecewise bilinear angular distribution over solid angle, returning lumens. */
export function integrateIESProfile(profile: IESProfile): number {
  const prepared = prepareIESProfile(profile);
  const {verticalAngles, horizontalAngles, values, horizontalSpan} = prepared;
  const rows = new Float64Array(horizontalAngles.length);
  for (let horizontalIndex = 0; horizontalIndex < rows.length; horizontalIndex++) {
    for (let verticalIndex = 0; verticalIndex < verticalAngles.length - 1; verticalIndex++) {
      const lowerAngle = verticalAngles[verticalIndex];
      const upperAngle = verticalAngles[verticalIndex + 1];
      const reflected = lowerAngle + upperAngle > 180;
      const lower = reflected ? 180 - upperAngle : lowerAngle;
      const upper = reflected ? 180 - lowerAngle : upperAngle;
      const midpoint = ((lower + upper) / 2) * DEGREES_TO_RADIANS;
      const halfWidth = ((upper - lower) / 2) * DEGREES_TO_RADIANS;
      // Stable cos(h) - sin(h)/h, including very narrow angular intervals.
      const squaredWidth = halfWidth * halfWidth;
      const difference =
        halfWidth < 0.001
          ? squaredWidth * (-1 / 3 + squaredWidth * (1 / 30 - squaredWidth / 840))
          : Math.cos(halfWidth) - Math.sin(halfWidth) / halfWidth;
      const sharedWeight = Math.sin(midpoint) * Math.sin(halfWidth);
      const offsetWeight = Math.cos(midpoint) * difference;
      const lowerWeight = Math.max(0, sharedWeight + offsetWeight);
      const upperWeight = Math.max(0, sharedWeight - offsetWeight);
      const offset = horizontalIndex * verticalAngles.length + verticalIndex;
      rows[horizontalIndex] +=
        values[offset] * (reflected ? upperWeight : lowerWeight) +
        values[offset + 1] * (reflected ? lowerWeight : upperWeight);
    }
  }
  let flux = 0;
  if (horizontalSpan === 0) flux = rows[0] * 2 * Math.PI;
  else {
    for (let index = 0; index < rows.length - 1; index++) {
      const angularWidth =
        (horizontalAngles[index + 1] - horizontalAngles[index]) * DEGREES_TO_RADIANS;
      flux += (rows[index] / 2 + rows[index + 1] / 2) * angularWidth;
    }
    flux *= 360 / horizontalSpan;
  }
  if (!Number.isFinite(flux)) throw new Error('IES: luminous flux overflow');
  return flux;
}

/** Resamples Type C photometry; no image decoding, world-axis conversion or GPU allocation occurs. */
export function resampleIESProfile(profile: IESProfile, options: IESResampleOptions = {}): IESGrid {
  const {verticalCount = 181, horizontalCount = 360, normalization = 'none'} = options;
  if (
    !Number.isSafeInteger(verticalCount) ||
    verticalCount < 2 ||
    !Number.isSafeInteger(horizontalCount) ||
    horizontalCount < 1 ||
    verticalCount * horizontalCount > MAX_GRID_SAMPLES ||
    !['none', 'peak'].includes(normalization)
  ) {
    throw new Error('IES: invalid resampling dimensions or normalization');
  }
  const prepared = prepareIESProfile(profile);
  const verticalAngles = Float64Array.from(
    {length: verticalCount},
    (_, index) => (index * 180) / (verticalCount - 1)
  );
  const horizontalAngles = Float64Array.from(
    {length: horizontalCount},
    (_, index) => (index * 360) / horizontalCount
  );
  const data = new Float64Array(verticalCount * horizontalCount);
  for (let horizontalIndex = 0; horizontalIndex < horizontalCount; horizontalIndex++) {
    for (let verticalIndex = 0; verticalIndex < verticalCount; verticalIndex++) {
      const intensity = samplePreparedProfile(
        prepared,
        verticalAngles[verticalIndex],
        horizontalAngles[horizontalIndex]
      );
      data[horizontalIndex * verticalCount + verticalIndex] =
        normalization === 'peak' ? (prepared.peak > 0 ? intensity / prepared.peak : 0) : intensity;
    }
  }
  return {
    width: verticalCount,
    height: horizontalCount,
    data,
    verticalAngles,
    horizontalAngles,
    unit: normalization === 'peak' ? 'relative' : 'candela',
    peakCandela: prepared.peak
  };
}

/** Validates and snapshots only the angular and intensity fields used by the calculations. */
function prepareIESProfile(profile: IESProfile): PreparedIESProfile {
  const {verticalAngles, horizontalAngles, candelaValues, candelaMultiplier} = profile;
  if (
    profile.photometricType !== 1 ||
    verticalAngles.length < 2 ||
    horizontalAngles.length < 1 ||
    candelaValues.length !== verticalAngles.length * horizontalAngles.length ||
    !Number.isFinite(candelaMultiplier) ||
    candelaMultiplier < 0
  ) {
    throw new Error('IES: invalid Type C calculation profile');
  }
  for (const [angles, maximum] of [
    [verticalAngles, 180],
    [horizontalAngles, 360]
  ] as const) {
    for (let index = 0; index < angles.length; index++) {
      if (
        !Number.isFinite(angles[index]) ||
        angles[index] < 0 ||
        angles[index] > maximum ||
        (index > 0 && angles[index] <= angles[index - 1])
      )
        throw new Error('IES: invalid calculation angles');
    }
  }
  const first = horizontalAngles[0];
  const last = horizontalAngles[horizontalAngles.length - 1];
  const horizontalSpan = last - first;
  if (
    horizontalAngles.length > 1 &&
    !((first === 0 && [90, 180, 360].includes(last)) || (first === 90 && last === 270))
  ) {
    throw new Error('IES: unsupported horizontal symmetry extent');
  }
  let peak = 0;
  const values = new Float64Array(candelaValues.length);
  for (let index = 0; index < values.length; index++) {
    const value = candelaValues[index];
    const scaled = value * candelaMultiplier;
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(scaled))
      throw new Error('IES: invalid calculation intensity');
    values[index] = scaled;
    peak = Math.max(peak, scaled);
  }
  return {
    verticalAngles: verticalAngles.slice(),
    horizontalAngles: horizontalAngles.slice(),
    values,
    horizontalSpan,
    peak
  };
}

/** Samples a validated snapshot, returning zero outside its measured vertical extent. */
function samplePreparedProfile(
  profile: PreparedIESProfile,
  verticalAngle: number,
  horizontalAngle: number
): number {
  const {verticalAngles, horizontalAngles, values, horizontalSpan} = profile;
  if (
    verticalAngle < verticalAngles[0] ||
    verticalAngle > verticalAngles[verticalAngles.length - 1]
  )
    return 0;
  const verticalIndex = findLowerAngle(verticalAngles, verticalAngle);
  const verticalWeight =
    (verticalAngle - verticalAngles[verticalIndex]) /
    (verticalAngles[verticalIndex + 1] - verticalAngles[verticalIndex]);
  let horizontalIndex = 0;
  let horizontalWeight = 0;
  if (horizontalSpan > 0) {
    const period = horizontalSpan === 360 ? 360 : horizontalSpan * 2;
    let folded = (((horizontalAngle - horizontalAngles[0]) % period) + period) % period;
    if (folded > horizontalSpan) folded = period - folded;
    const measuredAngle = horizontalAngles[0] + folded;
    horizontalIndex = findLowerAngle(horizontalAngles, measuredAngle);
    horizontalWeight =
      (measuredAngle - horizontalAngles[horizontalIndex]) /
      (horizontalAngles[horizontalIndex + 1] - horizontalAngles[horizontalIndex]);
  }
  const lowerOffset = horizontalIndex * verticalAngles.length + verticalIndex;
  const upperOffset = horizontalSpan === 0 ? lowerOffset : lowerOffset + verticalAngles.length;
  const lowerValue =
    values[lowerOffset] + (values[lowerOffset + 1] - values[lowerOffset]) * verticalWeight;
  const upperValue =
    values[upperOffset] + (values[upperOffset + 1] - values[upperOffset]) * verticalWeight;
  return lowerValue + (upperValue - lowerValue) * horizontalWeight;
}

/** Finds the lower knot, keeping the final coordinate in the last interval. */
function findLowerAngle(angles: Float64Array, angle: number): number {
  let lower = 0;
  let upper = angles.length - 1;
  while (upper - lower > 1) {
    const midpoint = Math.floor((lower + upper) / 2);
    if (angle < angles[midpoint]) upper = midpoint;
    else lower = midpoint;
  }
  return Math.min(lower, angles.length - 2);
}
