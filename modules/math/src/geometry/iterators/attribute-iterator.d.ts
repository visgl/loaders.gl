/**
 * Iterates over a single attribute
 * NOTE: For performance, re-yields the same modified element
 * @param param0
 */
export function makeAttributeIterator(option: {values; size: number}): Iterable<any>;
