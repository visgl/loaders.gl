// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import type {Color} from '@deck.gl/core';
import type {MeshArrowTable} from '@loaders.gl/schema';

const SH_C0 = 0.28209479177387814;
const DEFAULT_COLOR = [255, 255, 255, 255] as const;
const DEFAULT_SCALE_ENCODING = 'log';
const DEFAULT_OPACITY_ENCODING = 'logit';

/** Decoded Gaussian splat columns used by CPU and GPU render paths. */
export type GaussianSplatData = {
  /** Number of splats. */
  length: number;
  /** Interleaved `x, y, z` positions. */
  positions: Float32Array;
  /** Interleaved decoded `scale_0, scale_1, scale_2` standard deviations. */
  scales: Float32Array;
  /** Interleaved quaternion rotations from `rot_0..3`. */
  rotations: Float32Array;
  /** Normalized opacity values in linear alpha space. */
  opacities: Float32Array;
  /** RGBA colors derived from SH DC columns and opacity. */
  colors: Uint8Array;
  /** Circular fallback radii used by the CPU billboard renderer. */
  radii: Float32Array;
};

/** Convert a loaders.gl wrapper or raw Apache Arrow table to a raw Arrow table. */
export function getArrowTable(data: MeshArrowTable | arrow.Table): arrow.Table {
  return isMeshArrowTable(data) ? data.data : (data as arrow.Table);
}

/** Checks whether layer data is a loaders.gl Arrow table wrapper. */
export function isMeshArrowTable(data: MeshArrowTable | arrow.Table): data is MeshArrowTable {
  return (data as MeshArrowTable).shape === 'arrow-table';
}

/** Extract and decode all Gaussian splat columns needed by the render paths. */
export function getGaussianSplatDataFromArrowTable(
  table: arrow.Table,
  fallbackColor: Color = DEFAULT_COLOR,
  gaussianSupportRadius: number = 3
): GaussianSplatData {
  const length = table.numRows;
  const positions = getPositionValues(table);
  const scales = getSplatScales(table);
  const rotations = getSplatRotations(table);
  const opacities = getSplatOpacities(table, fallbackColor);
  const colors = getSplatColors(table, fallbackColor, opacities);
  const radii = getSplatRadii(scales, gaussianSupportRadius);

  return {length, positions, scales, rotations, opacities, colors, radii};
}

/** Return POSITION values as an interleaved XYZ array. */
export function getPositionValues(table: arrow.Table): Float32Array {
  const positionVector = table.getChild('POSITION');
  if (!positionVector) {
    throw new Error('SplatLayer requires a POSITION column.');
  }

  const directValues = getDirectFixedSizeListValues(positionVector, 3);
  if (directValues) {
    return directValues;
  }

  const positions = new Float32Array(table.numRows * 3);
  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    const position = positionVector.get(rowIndex) as ArrayLike<number> | null;
    if (!position || position.length < 3) {
      throw new Error(`SplatLayer could not read POSITION row ${rowIndex}.`);
    }
    positions[rowIndex * 3 + 0] = getArrayLikeValue(position, 0);
    positions[rowIndex * 3 + 1] = getArrayLikeValue(position, 1);
    positions[rowIndex * 3 + 2] = getArrayLikeValue(position, 2);
  }
  return positions;
}

/** Return decoded standard deviations from `scale_0..2` columns. */
export function getSplatScales(table: arrow.Table): Float32Array {
  const scale0 = getRequiredNumericColumn(table, 'scale_0');
  const scale1 = getRequiredNumericColumn(table, 'scale_1');
  const scale2 = getRequiredNumericColumn(table, 'scale_2');
  const scaleEncoding =
    getFieldMetadata(table, 'scale_0', 'loaders_gl.gaussian_splats.encoding') ||
    DEFAULT_SCALE_ENCODING;
  const scales = new Float32Array(table.numRows * 3);

  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    scales[rowIndex * 3 + 0] = decodeSplatScale(scale0[rowIndex], scaleEncoding);
    scales[rowIndex * 3 + 1] = decodeSplatScale(scale1[rowIndex], scaleEncoding);
    scales[rowIndex * 3 + 2] = decodeSplatScale(scale2[rowIndex], scaleEncoding);
  }

  return scales;
}

/** Return quaternion rotations from `rot_0..3` columns. */
export function getSplatRotations(table: arrow.Table): Float32Array {
  const rotation0 = getRequiredNumericColumn(table, 'rot_0');
  const rotation1 = getRequiredNumericColumn(table, 'rot_1');
  const rotation2 = getRequiredNumericColumn(table, 'rot_2');
  const rotation3 = getRequiredNumericColumn(table, 'rot_3');
  const rotations = new Float32Array(table.numRows * 4);

  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    rotations[rowIndex * 4 + 0] = rotation0[rowIndex];
    rotations[rowIndex * 4 + 1] = rotation1[rowIndex];
    rotations[rowIndex * 4 + 2] = rotation2[rowIndex];
    rotations[rowIndex * 4 + 3] = rotation3[rowIndex];
  }

  return rotations;
}

/** Return normalized opacity values from `opacity` or fallback alpha. */
export function getSplatOpacities(table: arrow.Table, fallbackColor: Color): Float32Array {
  const opacity = getOptionalNumericColumn(table, 'opacity');
  const opacityEncoding =
    getFieldMetadata(table, 'opacity', 'loaders_gl.gaussian_splats.encoding') ||
    DEFAULT_OPACITY_ENCODING;
  const opacities = new Float32Array(table.numRows);

  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    const alpha = opacity ? opacity[rowIndex] : (fallbackColor[3] ?? DEFAULT_COLOR[3]) / 255;
    opacities[rowIndex] = opacityEncoding === 'linear' ? alpha : 1 / (1 + Math.exp(-alpha));
  }

  return opacities;
}

/** Return splat colors from SH DC and normalized opacity columns. */
export function getSplatColors(
  table: arrow.Table,
  fallbackColor: Color,
  opacities: Float32Array = getSplatOpacities(table, fallbackColor)
): Uint8Array {
  const fdc0 = getOptionalNumericColumn(table, 'f_dc_0');
  const fdc1 = getOptionalNumericColumn(table, 'f_dc_1');
  const fdc2 = getOptionalNumericColumn(table, 'f_dc_2');
  const colors = new Uint8Array(table.numRows * 4);

  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    const colorIndex = rowIndex * 4;
    if (fdc0 && fdc1 && fdc2) {
      colors[colorIndex + 0] = normalizeColorByte(fdc0[rowIndex] * SH_C0 + 0.5);
      colors[colorIndex + 1] = normalizeColorByte(fdc1[rowIndex] * SH_C0 + 0.5);
      colors[colorIndex + 2] = normalizeColorByte(fdc2[rowIndex] * SH_C0 + 0.5);
    } else {
      colors[colorIndex + 0] = fallbackColor[0] ?? DEFAULT_COLOR[0];
      colors[colorIndex + 1] = fallbackColor[1] ?? DEFAULT_COLOR[1];
      colors[colorIndex + 2] = fallbackColor[2] ?? DEFAULT_COLOR[2];
    }

    colors[colorIndex + 3] = normalizeColorByte(opacities[rowIndex]);
  }

  return colors;
}

/** Return circular fallback radii from decoded anisotropic scales. */
export function getSplatRadii(
  scales: Float32Array,
  gaussianSupportRadius: number = 3
): Float32Array {
  const radii = new Float32Array(scales.length / 3);

  for (let rowIndex = 0; rowIndex < radii.length; rowIndex++) {
    const scale0 = scales[rowIndex * 3 + 0];
    const scale1 = scales[rowIndex * 3 + 1];
    const scale2 = scales[rowIndex * 3 + 2];
    radii[rowIndex] = Math.cbrt(scale0 * scale1 * scale2) * gaussianSupportRadius;
  }

  return radii;
}

/** Return a required numeric column as Float32 values. */
export function getRequiredNumericColumn(table: arrow.Table, columnName: string): Float32Array {
  const column = getOptionalNumericColumn(table, columnName);
  if (!column) {
    throw new Error(`SplatLayer requires a ${columnName} column.`);
  }
  return column;
}

/** Return an optional numeric column as Float32 values. */
export function getOptionalNumericColumn(
  table: arrow.Table,
  columnName: string
): Float32Array | null {
  const column = table.getChild(columnName);
  if (!column) {
    return null;
  }

  const values = new Float32Array(table.numRows);
  for (let rowIndex = 0; rowIndex < table.numRows; rowIndex++) {
    values[rowIndex] = Number(column.get(rowIndex) ?? 0);
  }
  return values;
}

/** Return one field metadata value. */
export function getFieldMetadata(
  table: arrow.Table,
  fieldName: string,
  key: string
): string | undefined {
  return table.schema.fields.find(field => field.name === fieldName)?.metadata.get(key);
}

/** Decode one scale component from the column encoding. */
export function decodeSplatScale(scale: number, scaleEncoding: string): number {
  return scaleEncoding === 'linear' ? Math.max(scale, 0) : Math.exp(scale);
}

/** Return a direct typed array for a single-chunk FixedSizeList vector when possible. */
function getDirectFixedSizeListValues(vector: arrow.Vector, size: number): Float32Array | null {
  const data = vector.data[0];
  const childData = data?.children[0];
  if (vector.data.length !== 1 || data.offset !== 0 || !childData?.values) {
    return null;
  }

  const values = childData.values;
  if (values instanceof Float32Array && values.length === vector.length * size) {
    return values;
  }

  return null;
}

/** Return an indexed value from either an array or an Arrow vector. */
function getArrayLikeValue(values: ArrayLike<number>, index: number): number {
  const value = hasGetValue(values) ? values.get(index) : values[index];
  return Number(value);
}

/** Return true when a value has an Arrow-vector-style getter. */
function hasGetValue(values: ArrayLike<number>): values is ArrayLike<number> & {
  get: (index: number) => number;
} {
  return 'get' in values && typeof values.get === 'function';
}

/** Clamp a normalized color value and convert it to an unorm8 byte. */
function normalizeColorByte(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 1) * 255);
}
