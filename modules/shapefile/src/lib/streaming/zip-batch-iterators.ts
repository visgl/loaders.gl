/**
 * Zip two iterators together
 * 
 * @param iterator1
 * @param iterator2
 */
export async function* zipBatchIterators(
  iterator1: AsyncIterator<any[]>,
  iterator2: AsyncIterator<any[]>
): AsyncGenerator<number[][], void, unknown> {
  let batch1 = [];
  let batch2 = [];
  let iterator1Done: boolean = false;
  let iterator2Done: boolean = false;

  // TODO - one could let all iterators flow at full speed using `Promise.race`
  // however we might end up with a big temporary buffer
  while (!iterator1Done && !iterator2Done) {
    if (batch1.length === 0 && !iterator1Done) {
      const {value, done} = await iterator1.next();
      if (done) {
        iterator1Done = true;
      } else {
        batch1 = value;
      }
    } else if (batch2.length === 0 && !iterator2Done) {
      const {value, done} = await iterator2.next();
      if (done) {
        iterator2Done = true;
      } else {
        batch2 = value;
      }
    }

    const batch = extractBatch(batch1, batch2);
    if (batch) {
      yield batch;
    }
  }
}

/**
 * Extract batch of same length from two batches
 * 
 * @param batch1
 * @param batch2
 * @return array | null
 */
function extractBatch(batch1: number[], batch2: number[]): number[][] | null {
  const batchLength: number = Math.min(batch1.length, batch2.length);
  if (batchLength === 0) {
    return null;
  }

  // Non interleaved arrays
  const batch: number[][] = [batch1.slice(0, batchLength), batch2.slice(0, batchLength)];

  // Modify the 2 batches
  batch1.splice(0, batchLength);
  batch2.splice(0, batchLength);
  return batch;
}
