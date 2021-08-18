import {makeLineIterator, makeTextDecoderIterator} from '@loaders.gl/loader-utils';

export default async function* parseNDJSONInBatches(
  binaryAsyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
): AsyncIterable<Object> {
  const textIterator = makeTextDecoderIterator(binaryAsyncIterator);
  const lineIterator = makeLineIterator(textIterator);

  for await (const chunk of lineIterator) {
    yield JSON.parse(chunk)
  }
}
