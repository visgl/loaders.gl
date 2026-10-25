// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type CFVariableMetadata = {
  units?: string;
  standardName?: string;
  longName?: string;
  axis?: string;
  coordinates?: readonly string[];
  gridMapping?: string;
  calendar?: string;
  fillValue?: number;
  missingValue?: number;
  scaleFactor?: number;
  addOffset?: number;
  validRange?: readonly [number, number];
};
const numeric = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const string = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;
/** Decode common CF attributes without conflating raw and scaled values. */
export function parseCFVariableMetadata(
  attributes: Readonly<Record<string, unknown>>
): CFVariableMetadata {
  const range = attributes.valid_range;
  return {
    units: string(attributes.units),
    standardName: string(attributes.standard_name),
    longName: string(attributes.long_name),
    axis: string(attributes.axis),
    coordinates: string(attributes.coordinates)?.trim().split(/\s+/).filter(Boolean),
    gridMapping: string(attributes.grid_mapping),
    calendar: string(attributes.calendar),
    fillValue: numeric(attributes._FillValue),
    missingValue: numeric(attributes.missing_value),
    scaleFactor: numeric(attributes.scale_factor),
    addOffset: numeric(attributes.add_offset),
    validRange:
      Array.isArray(range) && range.length === 2 && range.every(v => numeric(v) !== undefined)
        ? [range[0], range[1]]
        : undefined
  };
}
/** Apply CF packing and missing-data rules to numeric samples. */
export function decodeCFNumericValues(
  values: ArrayLike<number>,
  metadata: CFVariableMetadata
): Float64Array {
  const result = new Float64Array(values.length);
  for (let i = 0; i < values.length; i++) {
    const raw = values[i];
    const invalid =
      !Number.isFinite(raw) ||
      raw === metadata.fillValue ||
      raw === metadata.missingValue ||
      (metadata.validRange !== undefined &&
        (raw < metadata.validRange[0] || raw > metadata.validRange[1]));
    result[i] = invalid ? NaN : raw * (metadata.scaleFactor ?? 1) + (metadata.addOffset ?? 0);
  }
  return result;
}
