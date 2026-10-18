import {fetchFile} from '@loaders.gl/core';
import {isBrowser} from '@loaders.gl/core/loader-utils';
import {BlobFile, NodeFile, ReadableFile} from '@loaders.gl/core/loader-utils';
import {ArrayBufferFile} from '@loaders.gl/core/loader-utils';

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
  return new ArrayBufferFile(arrayBuffer);
}

export function createBrowserReadableFile(arrayBuffer: ArrayBuffer): ReadableFile {
  return new BlobFile(arrayBuffer);
}
