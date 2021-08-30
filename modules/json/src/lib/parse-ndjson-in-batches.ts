import type {Batch} from '@loaders.gl/schema';
import {TableBatchBuilder} from '@loaders.gl/schema';
import {makeLineIterator, makeTextDecoderIterator} from '@loaders.gl/loader-utils';

export default async function* parseNDJSONInBatches(
  binaryAsyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
): AsyncIterable<Batch> {
  const textIterator = makeTextDecoderIterator(binaryAsyncIterator);
  const lineIterator = makeLineIterator(textIterator);

  const schema = null;
  const shape = 'row-table';
  // @ts-ignore
  const tableBatchBuilder = new TableBatchBuilder(schema, {
    shape
  });

  for await (const chunk of lineIterator) {
    tableBatchBuilder.addObjectRow(JSON.parse(chunk));
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
