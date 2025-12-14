import {concatenateArrayBuffers} from '../binary-utils/array-buffer-utils'

// GENERAL UTILITIES

/**
 * Iterates over an {@link AsyncIterable} or {@link Iterable}, invoking `visitor` for each yielded
 * value without rewinding the iterator when exiting early. This enables the caller to continue
 * iterating in another loop after `visitor` signals cancellation.
 */
export async function forEach<TValue>(
  iterable: AsyncIterable<TValue> | Iterable<TValue> | AsyncIterator<TValue>,
  visitor: (value: TValue) => any,
) {
  const iterator = toAsyncIterator(iterable)
  // eslint-disable-next-line
  while (true) {
    const {done, value} = await iterator.next()
    if (done) {
      if (iterator.return) {
        iterator.return()
      }
      return
    }
    const cancel = visitor(value)
    if (cancel) {
      return
    }
  }
}

/**
 * Concatenates all binary chunks yielded by an async or sync iterator.
 * Supports `ArrayBuffer`, typed array views, and `ArrayBufferLike` sources (e.g. `SharedArrayBuffer`).
 * This allows atomic parsers to operate on iterator inputs by materializing them into a single buffer.
 */
export async function concatenateArrayBuffersAsync(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
): Promise<ArrayBuffer> {
  const arrayBuffers: ArrayBuffer[] = []
  for await (const chunk of asyncIterator) {
    arrayBuffers.push(copyToArrayBuffer(chunk))
  }
  return concatenateArrayBuffers(...arrayBuffers)
}

export async function concatenateStringsAsync(
  asyncIterator: AsyncIterable<string> | Iterable<string>,
): Promise<string> {
  const strings: string[] = []
  for await (const chunk of asyncIterator) {
    strings.push(chunk)
  }
  return strings.join('')
}

/**
 * Normalizes binary chunk iterators to yield `ArrayBuffer` instances.
 * Accepts `ArrayBuffer`, `ArrayBufferView`, and `ArrayBufferLike` sources
 * (e.g. `SharedArrayBuffer`) and returns a copied `ArrayBuffer` for each chunk.
 */
export async function* toArrayBufferIterator(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
): AsyncIterable<ArrayBuffer> {
  for await (const chunk of asyncIterator) {
    yield copyToArrayBuffer(chunk)
  }
}

function copyToArrayBuffer(
  chunk: ArrayBufferLike | ArrayBufferView | ArrayBuffer,
): ArrayBuffer {
  if (chunk instanceof ArrayBuffer) {
    return chunk
  }

  if (ArrayBuffer.isView(chunk)) {
    const {buffer, byteOffset, byteLength} = chunk
    return copyFromBuffer(buffer, byteOffset, byteLength)
  }

  return copyFromBuffer(chunk as ArrayBufferLike)
}

function copyFromBuffer(
  buffer: ArrayBufferLike,
  byteOffset = 0,
  byteLength = buffer.byteLength - byteOffset,
): ArrayBuffer {
  const view = new Uint8Array(buffer, byteOffset, byteLength)
  const copy = new Uint8Array(view.length)
  copy.set(view)
  return copy.buffer
}

function toAsyncIterator<TValue>(
  iterable: AsyncIterable<TValue> | Iterable<TValue> | AsyncIterator<TValue>,
): AsyncIterator<TValue> {
  if (typeof (iterable as AsyncIterable<TValue>)[Symbol.asyncIterator] === 'function') {
    return (iterable as AsyncIterable<TValue>)[Symbol.asyncIterator]()
  }

  if (typeof (iterable as Iterable<TValue>)[Symbol.iterator] === 'function') {
    const iterator = (iterable as Iterable<TValue>)[Symbol.iterator]()
    return {
      next: async () => iterator.next(),
      return: iterator.return?.bind(iterator)
    }
  }

  return iterable as AsyncIterator<TValue>
}
