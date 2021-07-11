//
import {fs} from '@loaders.gl/loader-utils';

/**
 * Reads a chunk from a random access file
 * @param file
 * @param start
 * @param length
 * @returns
 */
export async function readArrayBuffer(
  file: Blob | ArrayBuffer | string | number,
  start: number,
  length: number
): Promise<ArrayBuffer> {
  if (typeof file === 'number') {
    return await fs._readToArrayBuffer(file, start, length);
  }
  // TODO - we can do better for ArrayBuffer and string
  if (!(file instanceof Blob)) {
    file = new Blob([file]);
  }
  const slice = file.slice(start, start + length);
  return await readBlob(slice);
}

/**
 * Read a slice of a Blob or File, without loading the entire file into memory
 * The trick when reading File objects is to read successive "slices" of the File
 * Per spec https://w3c.github.io/FileAPI/, slicing a File only updates the start and end fields
 * Actually reading from file happens in `readAsArrayBuffer`
 * @param blob to read
 */
export async function readBlob(blob: Blob): Promise<ArrayBuffer> {
  return await new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (event: ProgressEvent<FileReader>) =>
      resolve(event?.target?.result as ArrayBuffer);
    // TODO - reject with a proper Error
    fileReader.onerror = (error: ProgressEvent<FileReader>) => reject(error);
    fileReader.readAsArrayBuffer(blob);
  });
}
