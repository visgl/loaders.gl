import type {IteratorOptions} from './make-iterator';

const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB — biggest value that keeps UI responsive

/**
 * Returns an iterator that breaks a big Blob into chunks and yields them one-by-one
 * @param blob Blob or File object
 * @param options
 * @param options.chunkSize
 */
export async function* makeBlobIterator(
  blob: Blob,
  options?: IteratorOptions
): AsyncIterable<ArrayBuffer> {
  const chunkSize = options?.chunkSize || DEFAULT_CHUNK_SIZE;

  let offset = 0;
  while (offset < blob.size) {
    const end = offset + chunkSize;

    const chunk = await readFileSlice(blob, offset, end);

    offset = end;
    yield chunk;
  }
}

/**
 * Read a slice of a Blob or File, without loading the entire file into memory
 * @param file
 * @param offset
 * @param end
 */
export async function readFileSlice(file: Blob, offset: number, end: number): Promise<ArrayBuffer> {
  return await new Promise((resolve, reject) => {
    // The trick when reading File objects is to read successive "slices" of the File
    // Per spec https://w3c.github.io/FileAPI/, slicing a File should only update the start and end fields
    // Actually reading from file should happen in `readAsArrayBuffer` (and as far we can tell it does)
    const slice = file.slice(offset, end);

    const fileReader = new FileReader();
    fileReader.onload = (event: ProgressEvent<FileReader>) =>
      resolve(event?.target?.result as ArrayBuffer);
    // TODO - reject with a proper Error
    fileReader.onerror = (error: ProgressEvent<FileReader>) => reject(error);
    fileReader.readAsArrayBuffer(slice);
  });
}
