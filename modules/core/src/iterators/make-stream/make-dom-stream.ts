export type MakeDOMStreamOptions = {
  /** Stream allocates an arrayBuffer. Enables use of a default reader. */
  autoAllocateChunkSize?: number;
  /** Total number of chunks in queue before back pressure is applied */
  highWaterMark?: number;
};

/** Builds a DOM stream from an iterator */
export function makeDOMStream<ArrayBuffer>(
  source: Iterable<ArrayBuffer> | AsyncIterable<ArrayBuffer>,
  options?: MakeDOMStreamOptions
): ReadableStream {
  const iterator = source[Symbol.asyncIterator]
    ? source[Symbol.asyncIterator]()
    : source[Symbol.iterator]();

  return new ReadableStream<Uint8Array>(
    {
      // Create a byte stream (enables `Response(stream).arrayBuffer()`)
      // Only supported on Chrome
      // See: https://developer.mozilla.org/en-US/docs/Web/API/ReadableByteStreamController
      // @ts-expect-error Only Chrome supports byte streams
      type: 'bytes',

      async pull(controller) {
        try {
          const {done, value} = await iterator.next();
          if (done) {
            controller.close();
          } else {
            // TODO - ignores controller.desiredSize
            controller.enqueue(new Uint8Array(value));
          }
        } catch (error) {
          controller.error(error);
        }
      },

      async cancel() {
        await iterator?.return?.();
      }
    },
    // options: QueingStrategy<Uint8Array>
    {
      // This is bytes, not chunks
      highWaterMark: 2 ** 24,
      ...options
    }
  );
}
