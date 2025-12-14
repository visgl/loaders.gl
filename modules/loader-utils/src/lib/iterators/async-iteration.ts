import {concatenateArrayBuffers} from '../binary-utils/array-buffer-utils';

// GENERAL UTILITIES

/**
 * Iterates over an {@link AsyncIterator}, invoking `visitor` for each yielded value without
 * rewinding the iterator when exiting early. This enables the caller to continue iterating
 * in another loop after `visitor` signals cancellation.
 */
export async function forEach<TValue>(iterator: AsyncIterator<TValue>, visitor: (value: TValue) => any) {
  // eslint-disable-next-line
  while (true) {
    const {done, value} = await iterator.next();
    if (done) {
      if (iterator.return) {
        iterator.return()
      }
      return
    }
    const cancel = visitor(value);
    if (cancel) {
      return;
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
    | Iterable<ArrayBufferLike | ArrayBufferView>
): Promise<ArrayBuffer> {
  const arrayBuffers: ArrayBuffer[] = [];
  for await (const chunk of asyncIterator) {
    if (chunk instanceof ArrayBuffer) {
      arrayBuffers.push(chunk);
      continue;
    }

    if (ArrayBuffer.isView(chunk)) {
      const view = chunk;
      arrayBuffers.push(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
      continue;
    }

    const view = new Uint8Array(chunk as ArrayBufferLike);
    arrayBuffers.push(view.slice().buffer);
  }
  return concatenateArrayBuffers(...arrayBuffers);
}

export async function concatenateStringsAsync(
  asyncIterator: AsyncIterable<string> | Iterable<string>
): Promise<string> {
  const strings: string[] = [];
  for await (const chunk of asyncIterator) {
    strings.push(chunk);
  }
  return strings.join('');
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
    if (chunk instanceof ArrayBuffer) {
      yield chunk
      continue
    }

    if (ArrayBuffer.isView(chunk)) {
      const view = chunk
      yield view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
      continue
    }

    const view = new Uint8Array(chunk as ArrayBufferLike)
    yield view.slice().buffer
  }
}
