import {Batch} from '@loaders.gl/schema';

/**
 * Zip two iterators together
 */
export async function* zipBatchIterators<
  BatchType1 extends Batch = Batch,
  BatchType2 extends Batch = Batch
>(
  iterator1: AsyncIterator<BatchType1>,
  iterator2: AsyncIterator<BatchType2>
): AsyncGenerator<BatchType1, void, unknown> {
  const batch1: BatchType1[] = [];
  const batch2: BatchType2[] = [];
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
        batch1.push(value);
      }
    } else if (batch2.length === 0 && !iterator2Done) {
      const {value, done} = await iterator2.next();
      if (done) {
        iterator2Done = true;
      } else {
        batch2.push(value);
      }
    }

    const batch = extractBatch<BatchType1, BatchType2>(batch1, batch2);
    if (batch) {
      yield batch;
    }
  }
}

/**
 * Extract batch of same length from two batches
 */
function extractBatch<BatchType1 extends Batch = Batch, BatchType2 extends Batch = Batch>(
  batch1: BatchType1[],
  batch2: BatchType2[]
): BatchType1 | null {
  if (!batch1 || !batch2) {
    return null;
  }

  const {data: data1} = batch1;
  const {data: data2} = batch2;

  const dataLength: number = Math.min(data1.length, data2.length);
  if (dataLength === 0) {
    return null;
  }

  // Non interleaved arrays
  // Note that this discards progress information from the second batch
  const result: BatchType1 = {
    ...batch1,
    length: dataLength,
    data: [data1.slice(0, dataLength), data2.slice(0, dataLength)]
  };

  // Modify the 2 data arrays
  data1.splice(0, dataLength);
  data2.splice(0, dataLength);

  return result;
}
