import {IncrementalTransform} from './incremental-transform';

/**
 *
 * @param asyncIterator
 * @param IncrementalTransform
 * @param options
 */
export async function* makeTransformIterator(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  Transform: IncrementalTransform,
  options?: object
): AsyncIterable<any> {
  // @ts-ignore typescript doesn't like dynamic constructors
  const transform = new Transform(options);
  for await (const chunk of asyncIterator) {
    const output = await transform.write(chunk);
    if (output) {
      yield output;
    }
  }
  const output = await transform.end();
  if (output) {
    yield output;
  }
}
