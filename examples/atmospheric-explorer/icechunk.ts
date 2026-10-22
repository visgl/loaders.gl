// loaders.gl example — read-only Icechunk adapter for Zarrita
// SPDX-License-Identifier: MIT
import {IcechunkStore} from 'icechunk-js';
import * as zarrita from 'zarrita';
import {createGaussianGridFromCoordinates, type GaussianGrid} from './grid';

export type IcechunkReference =
  | {branch: string; tag?: never; snapshot?: never}
  | {tag: string; branch?: never; snapshot?: never}
  | {snapshot: string; branch?: never; tag?: never};

export type IcechunkFieldOptions = {
  root: string;
  path: string;
  dimensions: string[];
  selection: Record<string, number>;
  reference?: IcechunkReference;
  signal?: AbortSignal;
  /** Load the archive's latitude and longitude point arrays when no grid is supplied. */
  loadCoordinates?: boolean;
};

/**
 * Open an immutable Icechunk read session and select a single 1D field.
 * The returned typed array is still in the dataset's native spatial ordering.
 */
export async function readIcechunkField(options: IcechunkFieldOptions): Promise<{
  data: ArrayLike<number>;
  shape: number[];
  dtype: string;
  /** Explicit coordinates from the same Icechunk read session as the field. */
  grid?: GaussianGrid;
}> {
  const {root, path, dimensions, selection, signal} = options;
  if (!/^https?:\/\//.test(root)) throw new Error('Icechunk root must be HTTP(S)');
  if (!path || !dimensions.length) throw new Error('Array path and dimensions are required');
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const reference = options.reference || {branch: 'main'};
  const store = await IcechunkStore.open(root, {...reference, signal});
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const array = await zarrita.open(store.resolve(path), {kind: 'array', signal});
  if (array.shape.length !== dimensions.length) {
    throw new Error(`Expected ${dimensions.length} dimensions, found ${array.shape.length}`);
  }
  const selectors = dimensions.map((dimension, index) => {
    const selected = selection[dimension];
    if (selected === undefined) return null;
    if (!Number.isSafeInteger(selected) || selected < 0 || selected >= array.shape[index]) {
      throw new Error(`Invalid index ${selected} for ${dimension}`);
    }
    return selected;
  });
  if (selectors.filter(value => value === null).length !== 1) {
    throw new Error('Select every dimension except the flat spatial point axis');
  }
  const result = await zarrita.get(array, selectors, {signal});
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (result.shape.length !== 1) throw new Error('Expected a one-dimensional field');
  let grid: GaussianGrid | undefined;
  if (options.loadCoordinates) {
    const latitudeArray = await zarrita.open(store.resolve('latitude'), {kind: 'array', signal});
    const longitudeArray = await zarrita.open(store.resolve('longitude'), {kind: 'array', signal});
    if (latitudeArray.shape.length !== 1 || longitudeArray.shape.length !== 1) {
      throw new Error('Expected one-dimensional point coordinates');
    }
    const [latitudes, longitudes] = await Promise.all([
      zarrita.get(latitudeArray, [null], {signal}),
      zarrita.get(longitudeArray, [null], {signal})
    ]);
    grid = createGaussianGridFromCoordinates(
      latitudes.data as ArrayLike<number>, longitudes.data as ArrayLike<number>
    );
  }
  return {data: result.data as ArrayLike<number>, shape: [...result.shape], dtype: String(array.dtype), grid};
}
