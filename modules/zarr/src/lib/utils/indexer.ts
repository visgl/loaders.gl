import {getDims} from './utils';

/*
 * The 'indexer' for a Zarr-based source translates
 * a 'selection' to an array of indices that align to
 * the labeled dimensions.
 *
 * > const labels = ['a', 'b', 'y', 'x'];
 * > const indexer = getIndexer(labels);
 * > console.log(indexer({ a: 10, b: 20 }));
 * > // [10, 20, 0, 0]
 */
export function getIndexer<T extends string>(labels: T[]) {
  const size = labels.length;
  const dims = getDims(labels);
  return (sel: {[K in T]: number} | number[]) => {
    if (Array.isArray(sel)) {
      return [...sel];
    }
    const selection: number[] = Array(size).fill(0);
    for (const [key, value] of Object.entries(sel)) {
      selection[dims(key as T)] = value as number;
    }
    return selection;
  };
}
