/** Zip two iterators together */
export function zipBatchIterators(
  iterator1: AsyncIterable<any[]>,
  iterator2: AsyncIterable<any[]>
): AsyncIterable<any[]>;
