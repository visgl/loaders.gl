// From https://github.com/rauschma/async-iter-demo/tree/master/src under MIT license
// http://2ality.com/2016/10/asynchronous-iteration.html

/**
 * Async Queue
 * - AsyncIterable: An async iterator can be
 * - Values can be pushed onto the queue
 * @example
 *   const asyncQueue = new AsyncQueue();
 *   setTimeout(() => asyncQueue.enqueue('tick'), 1000);
 *   setTimeout(() => asyncQueue.enqueue(new Error('done')), 10000);
 *   for await (const value of asyncQueue) {
 *     console.log(value); // tick
 *   }
 */
export default class AsyncQueue<T> {
  private _values: any[];
  private _settlers: any[];
  private _closed: boolean;

  constructor() {
    this._values = []; // enqueues > dequeues
    this._settlers = []; // dequeues > enqueues
    this._closed = false;
  }

  /** Return an async iterator for this queue */
  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this;
  }

  /** Push a new value - the async iterator will yield a promise resolved to this value */
  push(value: T): void {
    return this.enqueue(value);
  }

  /**
   * Push a new value - the async iterator will yield a promise resolved to this value
   * Add an error - the async iterator will yield a promise rejected with this value
   */
  enqueue(value: T | Error): void {
    if (this._closed) {
      throw new Error('Closed');
    }

    if (this._settlers.length > 0) {
      if (this._values.length > 0) {
        throw new Error('Illegal internal state');
      }
      const settler = this._settlers.shift();
      if (value instanceof Error) {
        settler.reject(value);
      } else {
        settler.resolve({value});
      }
    } else {
      this._values.push(value);
    }
  }

  /** Indicate that we not waiting for more values - The async iterator will be done */
  close(): void {
    while (this._settlers.length > 0) {
      const settler = this._settlers.shift();
      settler.resolve({done: true});
    }
    this._closed = true;
  }

  // ITERATOR IMPLEMENTATION

  /** @returns a Promise for an IteratorResult */
  next(): Promise<IteratorResult<T, any>> {
    // If values in queue, yield the first value
    if (this._values.length > 0) {
      const value = this._values.shift();
      if (value instanceof Error) {
        return Promise.reject(value);
      }
      return Promise.resolve({done: false, value});
    }

    // If queue is closed, the iterator is done
    if (this._closed) {
      if (this._settlers.length > 0) {
        throw new Error('Illegal internal state');
      }
      return Promise.resolve({done: true, value: undefined});
    }

    // Yield a promise that waits for new values to be enqueued
    return new Promise((resolve, reject) => {
      this._settlers.push({resolve, reject});
    });
  }
}
