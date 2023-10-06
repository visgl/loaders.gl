import '@loaders.gl/polyfills';
import {parseSLPKArchive, SLPKArchive} from '@loaders.gl/i3s';
import {FileHandleFile} from '@loaders.gl/loader-utils';

let slpkArchive: SLPKArchive;

/**
 * Open SLPK file for reading and load HASH file
 * @param fullLayerPath - full path to SLPK file
 */
export async function loadArchive(fullLayerPath: string): Promise<void> {
  slpkArchive = await parseSLPKArchive(await FileHandleFile.from(fullLayerPath), (msg) =>
    console.log(msg)
  );
  console.log('The server is ready to use');
}

/**
 * Get a file from SLPK
 * @param url - I3S HTTP URL
 * @returns  - file content
 */
export async function getFileByUrl(url: string): Promise<Buffer | null> {
  const trimmedPath = /^\/?(.*)\/?$/.exec(url);
  let uncompressedFile: Buffer | null = null;
  if (trimmedPath) {
    try {
      uncompressedFile = await slpkArchive.getFile(trimmedPath[1], 'http');
    } catch {
      // TODO - log error?
    }
  }
  return uncompressedFile;
}
