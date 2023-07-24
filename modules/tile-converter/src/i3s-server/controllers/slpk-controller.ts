import '@loaders.gl/polyfills';
import {parseSLPK} from '@loaders.gl/i3s';
import {FileHandleProvider} from '@loaders.gl/tile-converter';

let slpkArchive;

/**
 * Open SLPK file for reading and load HASH file
 * @param fullLayerPath - full path to SLPK file
 */
export const loadArchive = async (fullLayerPath: string): Promise<void> => {
  slpkArchive = await parseSLPK(await FileHandleProvider.from(fullLayerPath));
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
