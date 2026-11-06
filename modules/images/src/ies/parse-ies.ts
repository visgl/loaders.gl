// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
/** Measured Type C photometric distribution, without normalization or resampling. */
export type IESProfile = {
  /** Authored format revision. */
  revision: string;
  /** Header label/comment lines. */
  labels: string[];
  /** Lamp count. */
  lampCount: number;
  /** Lumens per lamp; -1 denotes absolute photometry. */
  lumensPerLamp: number;
  /** Multiplier for converting stored samples to candela. */
  candelaMultiplier: number;
  /** Supported LM-63 photometric type. */
  photometricType: 1;
  /** Luminaire dimensions unit. */
  dimensionUnit: 'feet' | 'meters';
  /** Authored luminaire width, length and height. */
  dimensions: [number, number, number];
  /** Ballast factor from the source. */
  ballastFactor: number;
  /** Revision-dependent ballast/lamp factor or reserved field. */
  auxiliaryFactor: number;
  /** Rated input watts. */
  inputWatts: number;
  /** Vertical sample angles in degrees. */
  verticalAngles: Float64Array;
  /** Horizontal sample angles in degrees, preserving authored angular origin. */
  horizontalAngles: Float64Array;
  /** Raw samples, vertical angle fastest; multiply by candelaMultiplier for candela. */
  candelaValues: Float64Array;
};

/** Parses LM-63-1991/1995/2002 Type C profiles with TILT=NONE. */
export function parseIES(text: string): IESProfile {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map(line => line.trim());
  const revision = lines[0];
  if (!['IESNA91', 'IESNA:LM-63-1995', 'IESNA:LM-63-2002'].includes(revision))
    throw new Error('IES: unsupported revision');
  const tiltIndex = lines.findIndex(line => line.startsWith('TILT='));
  if (tiltIndex < 1 || lines[tiltIndex] !== 'TILT=NONE')
    throw new Error('IES: only TILT=NONE is supported');
  const tokens = lines
    .slice(tiltIndex + 1)
    .join(' ')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.some(token => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token)))
    throw new Error('IES: invalid numeric record');
  const values = tokens.map(Number);
  if (values.length < 13 || !values.every(Number.isFinite))
    throw new Error('IES: incomplete numeric header');
  const [
    lampCount,
    lumensPerLamp,
    candelaMultiplier,
    verticalCount,
    horizontalCount,
    photometricType,
    units,
    width,
    length,
    height,
    ballastFactor,
    auxiliaryFactor,
    inputWatts
  ] = values;
  if (
    !Number.isSafeInteger(lampCount) ||
    lampCount < 1 ||
    !Number.isSafeInteger(verticalCount) ||
    verticalCount < 2 ||
    !Number.isSafeInteger(horizontalCount) ||
    horizontalCount < 1 ||
    candelaMultiplier < 0 ||
    (lumensPerLamp < 0 && lumensPerLamp !== -1) ||
    ballastFactor < 0 ||
    inputWatts < 0
  )
    throw new Error('IES: invalid photometric header');
  if (photometricType !== 1) throw new Error('IES: only Type C photometry is supported');
  if (units !== 1 && units !== 2) throw new Error('IES: unsupported dimension units');
  const sampleCount = verticalCount * horizontalCount;
  if (
    !Number.isSafeInteger(sampleCount) ||
    values.length !== 13 + verticalCount + horizontalCount + sampleCount
  )
    throw new Error('IES: sample count mismatch');
  const verticalAngles = Float64Array.from(values.slice(13, 13 + verticalCount));
  const horizontalAngles = Float64Array.from(
    values.slice(13 + verticalCount, 13 + verticalCount + horizontalCount)
  );
  validateAngles(verticalAngles, 180);
  validateAngles(horizontalAngles, 360);
  const candelaValues = Float64Array.from(values.slice(13 + verticalCount + horizontalCount));
  if (candelaValues.some(value => value < 0 || !Number.isFinite(value * candelaMultiplier)))
    throw new Error('IES: invalid candela value');
  return {
    revision,
    labels: lines.slice(1, tiltIndex),
    lampCount,
    lumensPerLamp,
    candelaMultiplier,
    photometricType: 1,
    dimensionUnit: units === 1 ? 'feet' : 'meters',
    dimensions: [width, length, height],
    ballastFactor,
    auxiliaryFactor,
    inputWatts,
    verticalAngles,
    horizontalAngles,
    candelaValues
  };
}

/** Checks monotonic Type C angles in the authored coordinate system. */
function validateAngles(values: Float64Array, maximum: number): void {
  if (
    values.some(
      (value, index) => value < 0 || value > maximum || (index > 0 && value <= values[index - 1])
    )
  )
    throw new Error('IES: invalid angle ordering or range');
}
