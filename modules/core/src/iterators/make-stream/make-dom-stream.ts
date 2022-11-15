export type MakeStreamOptions = {
  /** Stream allocates an arrayBuffer. Enables use of a default reader. */
  autoAllocateChunkSize?: number;
  /** Total number of chunks in queue before back pressure is applied */
  highWaterMark?: number;
};

/**
 * Builds a DOM stream from an iterator
 * This stream is currently used in browsers only,
 * but note that Web stream support is present in Node from Node 16
 * https://nodejs.org/api/webstreams.html#webstreams_web_streams_api
 */
export function makeStream<ArrayBuffer>(
  source: Iterable<ArrayBuffer> | AsyncIterable<ArrayBuffer>,
  options?: MakeStreamOptions
): ReadableStream {
  const iterator = source[Symbol.asyncIterator]
    ? (source as AsyncIterable<ArrayBuffer>)[Symbol.asyncIterator]()
    : (source as Iterable<ArrayBuffer>)[Symbol.iterator]();

  return new ReadableStream<Uint8Array>(
    {
      // Create a byte stream (enables `Response(stream).arrayBuffer()`)
      // Only supported on Chrome
      // See: https://developer.mozilla.org/en-US/docs/Web/API/ReadableByteStreamController
      type: 'bytes',

      async pull(controller) {
        try {
          const {done, value} = await iterator.next();
          if (done) {
            controller.close();
          } else {
            // TODO - ignores controller.desiredSize
            // @ts-expect-error Unclear why value is not correctly typed
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
