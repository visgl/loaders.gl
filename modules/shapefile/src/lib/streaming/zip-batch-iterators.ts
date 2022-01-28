type Batch = {
  data: number[] | number[][];
  progress?: {bytesUsed: number; totalBytes: number; rows: number};
};

/**
 * Zip two iterators together
 *
 * @param iterator1
 * @param iterator2
 */
export async function* zipBatchIterators(
  iterator1: AsyncIterator<any[]>,
  iterator2: AsyncIterator<any[]>
): AsyncGenerator<Batch, void, unknown> {
  let batch1 = {data: []};
  let batch2 = {data: []};
  let iterator1Done: boolean = false;
  let iterator2Done: boolean = false;

  // TODO - one could let all iterators flow at full speed using `Promise.race`
  // however we might end up with a big temporary buffer
  while (!iterator1Done && !iterator2Done) {
    if (batch1.data.length === 0 && !iterator1Done) {
      const {value, done} = await iterator1.next();
      if (done) {
        iterator1Done = true;
      } else {
        batch1 = value;
      }
    } else if (batch2.data.length === 0 && !iterator2Done) {
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
function extractBatch(batch1: Batch, batch2: Batch): Batch | null {
  const {data: data1, progress} = batch1;
  const {data: data2} = batch2;
  const dataLength: number = Math.min(data1.length, data2.length);
  if (dataLength === 0) {
    return null;
  }

  // Non interleaved arrays
  const result: any = {
    progress,
    data: [data1.slice(0, dataLength), data2.slice(0, dataLength)]
  };

  // Modify the 2 data arrays
  data1.splice(0, dataLength);
  data2.splice(0, dataLength);
  return result;
}
