const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB — biggest value that keeps UI responsive

export async function* makeBlobIterator(file, options = {}) {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;

  let offset = 0;
  while (offset < file.size) {
    const end = offset + chunkSize;

    const chunk = await readFileSlice(file, offset, end);

    offset = end;
    yield chunk;
  }
}

export async function readFileSlice(file, offset, end) {
  return await new Promise((resolve, reject) => {
    // The trick when reading File objects is to read successive "slices" of the File
    // Per spec https://w3c.github.io/FileAPI/, slicing a File should only update the start and end fields
    // Actually reading from file should happen in `readAsArrayBuffer` (and as far we can tell it does)
    const slice = file.slice(offset, end);

    const fileReader = new FileReader();
    fileReader.onload = (event) => resolve(event.target && event.target.result);
    fileReader.onerror = (error) => reject(error);
    fileReader.readAsArrayBuffer(slice);
  });
}
