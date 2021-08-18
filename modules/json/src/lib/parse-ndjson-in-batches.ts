import {makeLineIterator, makeTextDecoderIterator} from '@loaders.gl/loader-utils';

export default async function* parseNDJSONInBatches(
  binaryAsyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options: JSONLoaderOptions
): AsyncIterable<Batch> {
  const textIterator = makeTextDecoderIterator(binaryAsyncIterator);
  const lineIterator = makeLineIterator(textIterator);

  for await (const chunk of lineIterator) {
    yield JSON.parse(chunk)
  }
}
