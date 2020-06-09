export function* makeArrayBufferIterator(arrayBuffer, options = {}) {
  const {chunkSize = 256 * 1024} = options;

  let byteOffset = 0;

  while (byteOffset < arrayBuffer.byteLength) {
    // Create a chunk of the right size
    const chunkByteLength = Math.min(arrayBuffer.byteLength - byteOffset, chunkSize);
    const chunk = new ArrayBuffer(chunkByteLength);

    // Copy data from the big chunk
    const sourceArray = new Uint8Array(arrayBuffer, byteOffset, chunkByteLength);
    const chunkArray = new Uint8Array(chunk);
    chunkArray.set(sourceArray);

    // yield the chunk
    byteOffset += chunkByteLength;
    yield chunk;
  }
}
