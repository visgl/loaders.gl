// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Resolved child array within a generic Zarr multiscales layout. */
export type SpatialMultiscaleLevel = {
  /** Original asset identifier. */
  id: string;
  /** Selected variable's array path at this level. */
  array: string;
  /** Optional level group containing that variable. */
  group?: string;
  /** Absolute spatial metadata advertised on the layout entry. */
  attributes: Record<string, unknown>;
};

/** Resolves direct-array or common-variable group layouts without following external paths. */
export function getSpatialMultiscaleLevels(
  attributes: Record<string, unknown>,
  array: string
): SpatialMultiscaleLevel[] {
  const multiscales = attributes?.multiscales as {layout?: unknown} | undefined;
  const layout = multiscales?.layout;
  if (!Array.isArray(layout) || !layout.length) return [];
  const entries = layout as Array<Record<string, unknown>>;
  if (entries.some(entry => !entry || !isChildPath(entry.asset))) {
    throw new Error('Spatial multiscales assets must be relative child paths.');
  }
  const assets = entries.map(entry => entry.asset as string);
  if (new Set(assets).size !== assets.length) throw new Error('Duplicate spatial multiscales asset.');
  const matches = assets.filter(asset => array === asset || array.startsWith(`${asset}/`));
  if (matches.length !== 1) return [];
  const suffix = array.slice(matches[0].length);
  return entries.map((entry, index) => ({
    id: assets[index],
    array: `${assets[index]}${suffix}`,
    ...(suffix ? {group: assets[index]} : {}),
    attributes: entry
  }));
}

/** Accepts literal relative child paths, rejecting URL, encoded, and traversal syntax. */
function isChildPath(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 &&
    !/[\\%:?#\u0000-\u0020]/.test(value) &&
    value.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..');
}
