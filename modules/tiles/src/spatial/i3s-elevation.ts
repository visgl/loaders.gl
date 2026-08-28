// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const LINEAR_UNIT_TO_METERS: Readonly<Record<string, number>> = Object.freeze({
  meter: 1,
  millimeter: 0.001,
  centimeter: 0.01,
  decimeter: 0.1,
  kilometer: 1000,
  foot: 0.3048,
  yard: 0.9144,
  mile: 1609.344,
  'us-foot': 1200 / 3937,
  'us-inch': 0.0254000508001016,
  'us-yard': 3600 / 3937,
  'us-mile': 6336000 / 3937,
  'clarke-foot': 0.3047972654,
  'clarke-yard': 0.9143917962,
  'clarke-link': 0.201166195164,
  'sears-yard': 0.914398414616,
  'sears-foot': 0.304799471539,
  'sears-chain': 20.1167651216,
  'sears-1922-truncated-chain': 20.116756,
  'benoit-1895-b-chain': 20.1167824944,
  'indian-yard': 0.914398530744,
  'indian-1937-yard': 0.91439523,
  'gold-coast-foot': 0.304799710181
});

const LINEAR_UNIT_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  m: 'meter',
  metre: 'meter',
  meters: 'meter',
  metres: 'meter',
  mm: 'millimeter',
  millimetre: 'millimeter',
  millimeters: 'millimeter',
  millimetres: 'millimeter',
  cm: 'centimeter',
  centimetre: 'centimeter',
  centimeters: 'centimeter',
  centimetres: 'centimeter',
  dm: 'decimeter',
  decimetre: 'decimeter',
  decimeters: 'decimeter',
  decimetres: 'decimeter',
  km: 'kilometer',
  kilometre: 'kilometer',
  kilometers: 'kilometer',
  kilometres: 'kilometer',
  ft: 'foot',
  feet: 'foot',
  'us-survey-foot': 'us-foot',
  'us-survey-feet': 'us-foot',
  yd: 'yard',
  yards: 'yard',
  mi: 'mile',
  miles: 'mile'
});

/**
 * Resolves an ArcGIS/I3S linear unit to meters.
 *
 * @param unit - I3S `heightUnit`, `elevationInfo.unit`, or provider unit.
 * @returns Meters per unit, or `undefined` when the declaration is unsupported.
 */
export function getI3SLinearUnitScale(unit: string | undefined): number | undefined {
  if (!unit) {
    return undefined;
  }
  const normalized = unit.trim().toLowerCase().replaceAll('_', '-');
  const canonical = LINEAR_UNIT_ALIASES[normalized] || normalized;
  return LINEAR_UNIT_TO_METERS[canonical];
}

/**
 * Resolves the source-Z conversion declared by an I3S layer.
 *
 * Legacy `ZFactor` is an explicit conversion to meters and takes precedence over the descriptive
 * `heightUnit`. This avoids applying the same feet-to-meters conversion twice on layers that
 * publish both fields.
 *
 * @param heightUnit - Unit declared by `heightModelInfo.heightUnit`.
 * @param zFactor - Legacy layer conversion factor.
 * @returns Meters per stored Z unit, or `undefined` for an invalid declaration.
 */
export function getI3SVerticalUnitScale(
  heightUnit: string | undefined,
  zFactor: number | undefined
): number | undefined {
  if (zFactor !== undefined) {
    return Number.isFinite(zFactor) && zFactor > 0 ? zFactor : undefined;
  }
  return heightUnit ? getI3SLinearUnitScale(heightUnit) : 1;
}
