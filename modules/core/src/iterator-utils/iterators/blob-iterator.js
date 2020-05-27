const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB — biggest value that keeps UI responsive

async function* makeBlobIterator(file, options = {}) {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;

  let offset = 0;
  while (offset < file.size) {
    const end = offset + chunkSize;

    const promise = new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onloadend = event => resolve(event.target.result);
      // TODO: handle error

      // The trick when reading File objects is to read successive "slices" of the File
      // Per spec https://w3c.github.io/FileAPI/, slicing a File should only update the start and end fields
      // Actually reading from file should happen in `readAsArrayBuffer` (and as far we can tell it does)
      const slice = file.slice(offset, end);
      fileReader.readAsArrayBuffer(slice);
    });

    const chunk = await promise;
    offset = end;
    yield chunk;
  }
}
