/**
 * Returns an iterator that breaks a big string into chunks and yields them one-by-one
 */
export function* makeStringIterator(string, options = {}) {
  const {chunkSize = 256 * 1024} = options;

  let offset = 0;
  const textEncoder = new TextEncoder();
  while (offset < string.length) {
    // Create a chunk of the right size
    const chunkLength = Math.min(string.length - offset, chunkSize);
    const chunk = string.slice(offset, offset + chunkLength);
    offset += chunkLength;

    // yield an ArrayBuffer chunk
    yield textEncoder.encode(chunk);
  }
}
