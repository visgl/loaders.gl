/**
 * "Debounces" batches and returns them in groups
 */
export async function* timedBatchIterator<Batch>(batchIterator: AsyncIterable<Batch>, timeout) {
  let start = Date.now();
  let batches: Batch[] = [];
  for await (const batch of batchIterator) {
    batches.push(batch);
    if (Date.now() - start > timeout) {
      yield batches;
      start = Date.now();
      batches = [];
    }
  }

  if (batches) {
    yield batches;
  }
}
