import '@loaders.gl/polyfills';
import {fetchFile, parse} from '@loaders.gl/core';
import {SLPKLoader} from '@loaders.gl/i3s';
import path from 'path';

let slpkArchive;

export const loadArchive = async (fullLayerPath) => {
  slpkArchive = await (await fetchFile(fullLayerPath)).arrayBuffer();
};

const I3S_LAYER_PATH = process.env.I3sLayerPath || ''; // eslint-disable-line no-process-env, no-undef
const FULL_LAYER_PATH = path.join(process.cwd(), I3S_LAYER_PATH); // eslint-disable-line no-undef

loadArchive(FULL_LAYER_PATH);

export async function getFileByUrl(url) {
  const trimmedPath = /^\/?(.*)\/?$/.exec(url);
  let uncompressedFile;
  if (trimmedPath) {
    try {
      uncompressedFile = Buffer.from(
        await parse(slpkArchive, SLPKLoader, {
          slpk: {
            path: trimmedPath[1],
            pathMode: 'http'
          }
        })
      );
    } catch (e) {}
  }
  return uncompressedFile;
}
