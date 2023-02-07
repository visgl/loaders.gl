import type {ReadableOptions} from 'stream';
import * as Stream from 'stream';

class _Readable {}

type ReadableType = Stream.Readable | _Readable;
const Readable = Stream.Readable || _Readable;

export type MakeStreamOptions = ReadableOptions;

/** Builds a node stream from an iterator */
export function makeStream<ArrayBuffer>(
  source: Iterable<ArrayBuffer> | AsyncIterable<ArrayBuffer>,
  options?: ReadableOptions
): ReadableType {
  const iterator = source[Symbol.asyncIterator]
    ? source[Symbol.asyncIterator]()
    : source[Symbol.iterator]();
  return new AsyncIterableReadable(iterator, options);
}

class AsyncIterableReadable extends Readable {
  private _pulling: boolean;
  private _bytesMode: boolean;
  private _iterator: AsyncIterator<ArrayBuffer>;

  constructor(it: AsyncIterator<ArrayBuffer>, options?: ReadableOptions) {
    super(options);
    this._iterator = it;
    this._pulling = false;
    this._bytesMode = !options || !options.objectMode;
  }

  async _read(size: number): Promise<void> {
    if (!this._pulling) {
      this._pulling = true;
      this._pulling = await this._pull(size, this._iterator);
    }
  }

  async _destroy(error: Error | null, cb: (e: Error | null) => void): Promise<void> {
    if (!this._iterator) {
      return;
    }
    if (error) {
      await this._iterator?.throw?.(error);
    } else {
      await this._iterator?.return?.(error);
    }
    cb?.(null);
  }

  // eslint-disable-next-line complexity
  private async _pull(size: number, it: AsyncIterator<ArrayBuffer>): Promise<boolean> {
    const bm = this._bytesMode;
    let r: IteratorResult<ArrayBuffer> | null = null;
    // while (this.readable && !(r = await it.next(bm ? size : null)).done) {
    while (this.readable && !(r = await it.next()).done) {
      if (size !== null) {
        size -= bm && ArrayBuffer.isView(r.value) ? r.value.byteLength : 1;
      }
      if (!this.push(new Uint8Array(r.value)) || size <= 0) {
        break;
      }
    }
    if ((r?.done || !this.readable) && (this.push(null) || true)) {
      it?.return?.();
    }
    return !this.readable;
  }
}
