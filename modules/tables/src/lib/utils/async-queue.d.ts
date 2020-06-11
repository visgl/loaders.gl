/**
 * @returns a Promise for an Array with the elements in `asyncIterable`
 */
export function takeAsync(asyncIterable: AsyncIterable<any>, count?: number): Promise<any[]>

/**
 * Async Queue
 * From https://github.com/rauschma/async-iter-demo/tree/master/src under MIT license
 * http://2ality.com/2016/10/asynchronous-iteration.html
 */
export default class AsyncQueue {
  constructor();

  close(): void;

  [Symbol.asyncIterator](): AsyncIterator<any>;

  enqueue(value: any): void;

  /**
   * @returns a Promise for an IteratorResult
   */
  next(): Promise<any>;
}

