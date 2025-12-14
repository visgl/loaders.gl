import {fetchFile, isBrowser} from '@loaders.gl/core';
import {BlobFile, NodeFile, ReadableFile} from '@loaders.gl/loader-utils';
import {DataViewReadableFile} from '@loaders.gl/zip';

export async function loadArrayBufferFromFile(path: string): Promise<ArrayBuffer> {
  const response = await fetchFile(path);
  return await response.arrayBuffer();
}

export async function createReadableFileFromPath(path: string): Promise<ReadableFile> {
  if (isBrowser) {
    const arrayBuffer = await loadArrayBufferFromFile(path);
    return new BlobFile(arrayBuffer);
  }
  return new NodeFile(path);
}

export async function createReadableFileFromBuffer(
  arrayBuffer: ArrayBuffer
): Promise<ReadableFile> {
  return new DataViewReadableFile(new DataView(arrayBuffer));
}

export function createBrowserReadableFile(arrayBuffer: ArrayBuffer): ReadableFile {
  return new BlobFile(arrayBuffer);
}
