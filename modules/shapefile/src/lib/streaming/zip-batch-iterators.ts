// loaders.gl, MIT license

import type {ObjectRowTableBatch, ArrayRowTableBatch} from '@loaders.gl/schema';

type RowTableBatch = ObjectRowTableBatch | ArrayRowTableBatch;

/**
 * Zip two iterators together
 *
 * @param iterator1
 * @param iterator2
 */
export async function* zipBatchIterators(
  iterator1: AsyncIterator<RowTableBatch> | Iterator<RowTableBatch>,
  iterator2: AsyncIterator<RowTableBatch> | Iterator<RowTableBatch>,
  shape: 'object-row-table' | 'array-row-table'
): AsyncGenerator<RowTableBatch, void, unknown> {
  const batch1Data: unknown[] = [];
  const batch2Data: unknown[] = [];
  let iterator1Done: boolean = false;
  let iterator2Done: boolean = false;

  // TODO - one could let all iterators flow at full speed using `Promise.race`
  // however we might end up with a big temporary buffer
  while (!iterator1Done && !iterator2Done) {
    if (batch1Data.length === 0 && !iterator1Done) {
      const {value, done} = await iterator1.next();
      if (done) {
        iterator1Done = true;
      } else {
        // @ts-expect-error
        batch1Data.push(...value);
      }
    }
    if (batch2Data.length === 0 && !iterator2Done) {
      const {value, done} = await iterator2.next();
      if (done) {
        iterator2Done = true;
      } else {
        batch2Data.push(...value);
      }
    }

    const batchData = extractBatchData(batch1Data, batch2Data);
    if (batchData) {
      yield {
        batchType: 'data',
        shape,
        length: batchData.length,
        data: batchData
      };
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
function extractBatchData(batch1: any[], batch2: any[]): any[] | null {
  const batchLength: number = Math.min(batch1.length, batch2.length);
  if (batchLength === 0) {
    return null;
  }

  // Non interleaved arrays
  const batch: any[] = [...batch1.slice(0, batchLength), ...batch2.slice(0, batchLength)];

  // Modify the 2 batches
  batch1.splice(0, batchLength);
  batch2.splice(0, batchLength);
  return batch;
}
