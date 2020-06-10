/* global FileReader */

const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB — biggest value that keeps UI responsive

export async function* makeBlobIterator(file, options = {}) {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;

  let offset = 0;
  while (offset < file.size) {
    const end = offset + chunkSize;

    // The trick when reading File objects is to read successive "slices" of the File
    // Per spec https://w3c.github.io/FileAPI/, slicing a File should only update the start and end fields
    // Actually reading from file should happen in `readAsArrayBuffer` (and as far we can tell it does)
    const slice = file.slice(offset, end);

    const chunk = await readFileSlice(slice);

    offset = end;
    yield chunk;
  }
}

async function readFileSlice(slice) {
  return await new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = event => resolve(event.target.result);
    fileReader.onerror = error => reject(error);
    fileReader.readAsArrayBuffer(slice);
  });
}
