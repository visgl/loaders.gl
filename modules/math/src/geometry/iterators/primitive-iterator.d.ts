/**
 * Will iterate over each primitive, expanding (dereferencing) indices
 */
export function makePrimitiveIterator(options: {
  indices?: any;
  attributes: object;
  mode: number;
  start?: number;
  end?: number;
}): Iterable<{attributes: object, type: number, i1: number, i2: number, i3: number}>;
