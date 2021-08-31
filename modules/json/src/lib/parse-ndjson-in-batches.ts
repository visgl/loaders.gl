import type {Batch} from '@loaders.gl/schema';
import {TableBatchBuilder} from '@loaders.gl/schema';
import {LoaderOptions, makeLineIterator, makeTextDecoderIterator} from '@loaders.gl/loader-utils';

export default async function* parseNDJSONInBatches(
  binaryAsyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options: LoaderOptions
): AsyncIterable<Batch> {
  const textIterator = makeTextDecoderIterator(binaryAsyncIterator);
  const lineIterator = makeLineIterator(textIterator);

  const schema = null;
  const shape = 'row-table';
  // @ts-ignore
  const tableBatchBuilder = new TableBatchBuilder(schema, {
    ...options,
    shape
  });

  for await (const chunk of lineIterator) {
    const row = JSON.parse(chunk);
    tableBatchBuilder.addRow(row);
    tableBatchBuilder.chunkComplete(chunk);
    const batch = tableBatchBuilder.getFullBatch();
    if (batch) {
      yield batch;
    }
  }

  const batch = tableBatchBuilder.getFinalBatch();
  if (batch) {
    yield batch;
  }
}
