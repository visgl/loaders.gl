import type {OMEXML} from '../ome/omexml';
import type {Labels} from '../../types';

/*
 * Creates typed labels from DimensionOrder.
 * > imgMeta.Pixels.DimensionOrder === 'XYCZT'
 * > getLabels(imgMeta.Pixels) === ['t', 'z', 'c', 'y', 'x']
 */

type Sel<Dim extends string> = Dim extends `${infer Z}${infer X}${infer A}${infer B}${infer C}`
  ? [C, B, A]
  : 'error';
export function getLabels(dimOrder: OMEXML[0]['Pixels']['DimensionOrder']) {
  return dimOrder.toLowerCase().split('').reverse() as Labels<Sel<Lowercase<typeof dimOrder>>>;
}

/*
 * Creates an ES6 map of 'label' -> index
 * > const labels = ['a', 'b', 'c', 'd'];
 * > const dims = getDims(labels);
 * > dims('a') === 0;
 * > dims('b') === 1;
 * > dims('c') === 2;
 * > dims('hi!'); // throws
 */
export function getDims<S extends string>(labels: S[]) {
  const lookup = new Map(labels.map((name, i) => [name, i]));
  if (lookup.size !== labels.length) {
    throw Error('Labels must be unique, found duplicated label.');
  }
  return (name: S) => {
    const index = lookup.get(name);
    if (index === undefined) {
      throw Error('Invalid dimension.');
    }
    return index;
  };
}
