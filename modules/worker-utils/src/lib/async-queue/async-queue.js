// From https://github.com/rauschma/async-iter-demo/tree/master/src under MIT license
// http://2ality.com/2016/10/asynchronous-iteration.html

export default class AsyncQueue {
  constructor() {
    this._values = []; // enqueues > dequeues
    this._settlers = []; // dequeues > enqueues
    this._closed = false;
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  push(value) {
    return this.enqueue(value);
  }

  enqueue(value) {
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

  close() {
    while (this._settlers.length > 0) {
      const settler = this._settlers.shift();
      settler.resolve({done: true});
    }
    this._closed = true;
  }

  // ITERATOR IMPLEMENTATION

  /**
   * @returns a Promise for an IteratorResult
   */
  next() {
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
      return Promise.resolve({done: true});
    }

    // Yield a promise that waits for new values to be enqueued
    return new Promise((resolve, reject) => {
      this._settlers.push({resolve, reject});
    });
  }
}
