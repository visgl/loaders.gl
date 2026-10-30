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
  /**
   * OME-NGFF scale per axis name, composed from the dataset and multiscale transforms. Only its
   * ratios between levels are checked against georeferencing; it never georeferences a level.
   */
  scale?: Readonly<Record<string, number>>;
};

/**
 * Resolves direct-array or common-variable group layouts without following external paths.
 * OME-NGFF `datasets[]` are read as spatial levels only with `spatialOME`, which callers set when
 * the selected array declares a CRS; native OME metadata is otherwise not recast as spatial.
 */
export function getSpatialMultiscaleLevels(
  attributes: Record<string, unknown>,
  array: string,
  {spatialOME = false}: {spatialOME?: boolean} = {}
): SpatialMultiscaleLevel[] {
  const omeMultiscales = spatialOME ? getOMEMultiscales(attributes) : null;
  if (omeMultiscales) return getOMEMultiscaleLevels(omeMultiscales, array);
  const multiscales = attributes?.multiscales as {layout?: unknown} | undefined;
  const layout = multiscales?.layout;
  if (!Array.isArray(layout) || !layout.length) return [];
  const entries = layout as Array<Record<string, unknown>>;
  if (entries.some(entry => !entry || !isChildPath(entry.asset))) {
    throw new Error('Spatial multiscales assets must be relative child paths.');
  }
  const assets = entries.map(entry => entry.asset as string);
  if (new Set(assets).size !== assets.length) throw new Error('Duplicate spatial multiscales asset.');
  return resolveLevels(assets, array, entries);
}

/** Returns OME-NGFF v0.4 root `multiscales` or v0.5 `ome.multiscales`, if declared. */
function getOMEMultiscales(attributes: Record<string, unknown>): unknown[] | null {
  if (Array.isArray(attributes?.multiscales)) return attributes.multiscales;
  const ome = attributes?.ome as {multiscales?: unknown} | undefined;
  return Array.isArray(ome?.multiscales) ? ome.multiscales : null;
}

/**
 * Resolves OME-NGFF `datasets[]` as levels. Only the multiscale whose dataset paths contain the
 * selected array is used. Scales are composed for validation; translations are allowed and
 * ignored, and any other transform is rejected.
 */
function getOMEMultiscaleLevels(multiscales: unknown[], array: string): SpatialMultiscaleLevel[] {
  const candidates = multiscales.filter(multiscale => {
    const datasets = (multiscale as {datasets?: unknown})?.datasets;
    return Array.isArray(datasets) && datasets.some(dataset =>
      isChildPath(dataset?.path) && (array === dataset.path || array.startsWith(`${dataset.path}/`)));
  }) as Array<Record<string, unknown>>;
  if (!candidates.length) return [];
  if (candidates.length > 1) throw new Error('Array belongs to more than one OME-NGFF multiscale.');
  const multiscale = candidates[0];
  const datasets = multiscale.datasets as Array<Record<string, unknown>>;
  if (datasets.some(dataset => !dataset || !isChildPath(dataset.path))) {
    throw new Error('OME-NGFF dataset paths must be relative child paths.');
  }
  const paths = datasets.map(dataset => dataset.path as string);
  if (new Set(paths).size !== paths.length) throw new Error('Duplicate OME-NGFF dataset path.');
  const axes = getOMEAxisNames(multiscale.axes);
  return resolveLevels(paths, array, datasets.map(() => ({}))).map((level, index) => ({
    ...level,
    scale: getOMEScale(axes, [
      datasets[index].coordinateTransformations,
      multiscale.coordinateTransformations
    ])
  }));
}

/** Maps every asset to the selected variable's path at that level. */
function resolveLevels(
  assets: string[],
  array: string,
  attributes: Array<Record<string, unknown>>
): SpatialMultiscaleLevel[] {
  const matches = assets.filter(asset => array === asset || array.startsWith(`${asset}/`));
  if (matches.length !== 1) return [];
  const suffix = array.slice(matches[0].length);
  return assets.map((asset, index) => ({
    id: asset,
    array: `${asset}${suffix}`,
    ...(suffix ? {group: asset} : {}),
    attributes: attributes[index]
  }));
}

/** Reads axis names from v0.4+ axis objects or v0.3 axis strings. */
function getOMEAxisNames(axes: unknown): string[] {
  const names = Array.isArray(axes)
    ? axes.map(axis => (typeof axis === 'string' ? axis : (axis as {name?: unknown})?.name))
    : [];
  if (!names.length || names.some(name => typeof name !== 'string' || !name)) {
    throw new Error('OME-NGFF multiscales require named axes.');
  }
  if (new Set(names).size !== names.length) throw new Error('Duplicate OME-NGFF axis name.');
  return names as string[];
}

/** Composes scale transforms in the specified order: dataset first, then multiscale. */
function getOMEScale(axes: string[], transformLists: unknown[]): Record<string, number> {
  const scale = axes.map(() => 1);
  for (const transforms of transformLists) {
    if (transforms === undefined) continue;
    if (!Array.isArray(transforms)) {
      throw new Error('OME-NGFF coordinateTransformations must be a list.');
    }
    for (const transform of transforms as Array<Record<string, unknown>>) {
      if (transform?.type === 'translation') continue;
      if (transform?.type !== 'scale') {
        throw new Error(`Unsupported OME-NGFF coordinate transformation ${String(transform?.type)}.`);
      }
      const values = transform.scale;
      if (
        !Array.isArray(values) || values.length !== axes.length ||
        values.some(value => typeof value !== 'number' || !Number.isFinite(value) || value === 0)
      ) {
        throw new Error('OME-NGFF scale must give one finite non-zero value per axis.');
      }
      values.forEach((value, index) => (scale[index] *= value as number));
    }
  }
  return Object.fromEntries(axes.map((axis, index) => [axis, scale[index]]));
}

/** Accepts literal relative child paths, rejecting URL, encoded, and traversal syntax. */
function isChildPath(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 &&
    !/[\\%:?#\u0000- ]/.test(value) &&
    value.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..');
}
