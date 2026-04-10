// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Read a slice of a Blob or File, without loading the entire file into memory
 * The trick when reading File objects is to read successive "slices" of the File
 * Per spec https://w3c.github.io/FileAPI/, slicing a File only updates the start and end fields
 * @param file to read
 */
export async function readArrayBuffer(
  file: Blob | ArrayBuffer | any,
  start: number,
  length: number
): Promise<ArrayBuffer> {
  if (file instanceof Blob) {
    const slice = file.slice(start, start + length);
    return await slice.arrayBuffer();
  }
  return await file.read(start, start + length);
}
