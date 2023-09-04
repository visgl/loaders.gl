import '@loaders.gl/polyfills';
import {parseSLPK} from '@loaders.gl/i3s';
import {FileHandleFile} from '@loaders.gl/loader-utils';

let slpkArchive;

/**
 * Open SLPK file for reading and load HASH file
 * @param fullLayerPath - full path to SLPK file
 */
export const loadArchive = async (fullLayerPath: string): Promise<void> => {
  slpkArchive = await parseSLPK(await FileHandleFile.from(fullLayerPath), (msg) =>
    console.log(msg)
  );
  console.log('The server is ready to use');
};

/**
 * Get a file from SLPK
 * @param url - I3S HTTP URL
 * @returns  - file content
 */
export async function getFileByUrl(url: string) {
  const trimmedPath = /^\/?(.*)\/?$/.exec(url);
  let uncompressedFile: Buffer | null = null;
  if (trimmedPath) {
    try {
      uncompressedFile = Buffer.from(await slpkArchive.getFile(trimmedPath[1], 'http'));
    } catch (e) {}
  }
  return uncompressedFile;
}
