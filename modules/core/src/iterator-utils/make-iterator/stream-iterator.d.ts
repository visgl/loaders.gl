import fs from 'fs';

/**
 * Returns an async iterator for a stream (works in both Node.js and browsers)
 * @param stream stream to iterator over
 */
export function makeStreamIterator(
  stream: ReadableStream | fs.ReadStream
): AsyncIterable<ArrayBuffer>;
