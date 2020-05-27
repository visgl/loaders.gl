/**
 * Returns an async iterator for a stream (works in both Node.js and browsers)
 * @param stream stream to iterator over
 */
export function makeStreamIterator(stream: ReadableStream): AsyncIterable<ArrayBuffer>;
