/**
 * Zip two iterators together
 */
// eslint-disable-next-line complexity
export async function* zipBatchIterators(iterator1, iterator2, options) {
  let batch1 = [];
  let batch2 = [];
  let iterator1Done = false;
  let iterator2Done = false;

  // TODO - one could let all iterators flow at full speed using `Promise.race`
  // however we might end up with a big temporary buffer
  while (!iterator1Done && !iterator2Done) {
    if (!iterator1Done) {
      const {value, done} = await iterator1.next();
      if (done) {
        iterator1Done = true;
      } else {
        batch1 = value;
      }
    } else if (!iterator2Done) {
      const {value, done} = await iterator2.next();
      if (done) {
        iterator2Done = true;
      } else {
        batch2 = value;
      }
    }

    const batch = extractBatch(batch1, batch2, options);
    if (batch) {
      yield batch;
    }
  }
}

/**
 * Extract batch of same length from two batches
 *
 * @param  {array | object} batch1
 * @param  {array | object} batch2
 * @return {array?}
 */
function extractBatch(batch1, batch2, options) {
  const {key1, key2, resultKey = 'data'} = options || {};

  const iterable1 = key1 ? batch1[key1] : batch1;
  const iterable2 = key2 ? batch2[key2] : batch2;
  const batchLength = Math.min(iterable1.length, iterable2.length);
  if (batchLength === 0) {
    return null;
  }

  // Non interleaved arrays
  const batch = [iterable1.slice(0, batchLength), iterable2.slice(0, batchLength)];

  // Modify the 2 batches
  // This should modify the linked arrays in batch1 and batch2
  iterable1.splice(0, batchLength);
  iterable2.splice(0, batchLength);

  // Include non-data keys in result batch
  let keepKeys1 = [];
  if (!Array.isArray(batch1)) {
    keepKeys1 = Object.keys(batch1).filter(x => x !== key1 && x !== resultKey);
  }

  let keepKeys2 = [];
  if (!Array.isArray(batch2)) {
    keepKeys2 = Object.keys(batch2).filter(x => x !== key2 && x !== resultKey);
  }

  const result = {
    [resultKey]: batch
  };

  for (const keepKey of keepKeys1) {
    result[keepKey] = batch1[keepKey];
  }

  for (const keepKey of keepKeys2) {
    result[keepKey] = batch2[keepKey];
  }

  return result;
}
