// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {ScientificArraySource, ScientificSelection} from '../scientific-array';

/** Normalized two-dimensional vector field with components in metres per second. */
export type ScientificVectorField = {
  /** Names of the two dimensions. */
  dimensions: readonly [string, string];
  /** Length of each dimension. */
  shape: readonly [number, number];
  /** Eastward component in metres per second. */
  eastward: Float32Array;
  /** Northward component in metres per second. */
  northward: Float32Array;
  /** One for valid cells and zero for missing cells. */
  valid: Uint8Array;
  /** Optional regular geographic grid coordinates. */
  geographic?: {
    /** Longitude of the first column. */
    longitudeStart: number;
    /** Latitude of the first row. */
    latitudeStart: number;
    /** Longitude difference between columns. */
    longitudeStep: number;
    /** Latitude difference between rows. */
    latitudeStep: number;
  };
};
/** Input variable names and normalization options. */
export type VectorFieldOptions = {
  /** Eastward variable name. */
  eastward: string;
  /** Northward variable name. */
  northward: string;
  /** Optional selection passed to the scientific source. */
  selection?: ScientificSelection;
  /** Input velocity units. */
  units?: 'm/s' | 'cm/s' | 'knots';
  /** Values to mark as missing. */
  missingValues?: readonly number[];
  /** Optional regular geographic grid coordinates. */
  geographic?: ScientificVectorField['geographic'];
};
/** Normalize two aligned, two-dimensional velocity components into m/s. */
export async function createScientificVectorField(
  source: ScientificArraySource,
  options: VectorFieldOptions
): Promise<ScientificVectorField> {
  const [eastwardVariable, northwardVariable] = await Promise.all([
    source.readScientificVariable(options.eastward, options.selection),
    source.readScientificVariable(options.northward, options.selection)
  ]);
  if (
    eastwardVariable.shape.length !== 2 ||
    northwardVariable.shape.length !== 2 ||
    eastwardVariable.shape.some((length, index) => length !== northwardVariable.shape[index]) ||
    eastwardVariable.dimensions.some((name, index) => name !== northwardVariable.dimensions[index])
  ) {
    throw new Error('ScientificVectorField: component dimensions must match');
  }
  const count = eastwardVariable.shape[0] * eastwardVariable.shape[1];
  if (
    !Number.isSafeInteger(count) ||
    count <= 0 ||
    count > 100_000_000 ||
    !('length' in eastwardVariable.data) ||
    !('length' in northwardVariable.data) ||
    eastwardVariable.data.length !== count ||
    northwardVariable.data.length !== count
  ) {
    throw new Error('ScientificVectorField: invalid component arrays');
  }
  const scale =
    options.units === 'knots' ? 0.5144444444444445 : options.units === 'cm/s' ? 0.01 : 1;
  const eastward = new Float32Array(count);
  const northward = new Float32Array(count);
  const valid = new Uint8Array(count);
  const missing = new Set(options.missingValues ?? []);
  const eastwardData = eastwardVariable.data as unknown as ArrayLike<number>;
  const northwardData = northwardVariable.data as unknown as ArrayLike<number>;
  for (let index = 0; index < count; index++) {
    if (
      Number.isFinite(eastwardData[index]) &&
      Number.isFinite(northwardData[index]) &&
      !missing.has(eastwardData[index]) &&
      !missing.has(northwardData[index])
    ) {
      eastward[index] = eastwardData[index] * scale;
      northward[index] = northwardData[index] * scale;
      valid[index] = 1;
    } else {
      eastward[index] = NaN;
      northward[index] = NaN;
    }
  }
  return {
    dimensions: [eastwardVariable.dimensions[0], eastwardVariable.dimensions[1]],
    shape: [eastwardVariable.shape[0], eastwardVariable.shape[1]],
    eastward,
    northward,
    valid,
    geographic: options.geographic
  };
}
