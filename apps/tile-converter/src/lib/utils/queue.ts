export class Queue<T> extends Array<T> {
  enqueue(val: T) {
    this.push(val);
  }

  dequeue(): T | undefined {
    return this.shift();
  }

  peek(): T {
    return this[0];
  }

  isEmpty() {
    return this.length === 0;
  }
}
