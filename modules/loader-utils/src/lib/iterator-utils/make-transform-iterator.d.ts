import {IncrementalTransform} from './incremental-transform';

/**
 *
 * @param asyncIterator
 * @param IncrementalTransform
 * @param options
 */
export function makeTransformIterator(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  transform: IncrementalTransform,
  options?: object
): AsyncIterable<any>;
