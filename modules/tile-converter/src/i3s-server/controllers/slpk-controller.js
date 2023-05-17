require('@loaders.gl/polyfills')
const {fetchFile, parse} = require('@loaders.gl/core');
const {SLPKLoader} = require('@loaders.gl/i3s');
const path = require('path');

let slpkArchive;

const loadArchive = async (fullLayerPath) => {
  slpkArchive = await (await fetchFile(FULL_LAYER_PATH)).arrayBuffer();
  console.log('loaded')
}

const I3S_LAYER_PATH = process.env.I3sLayerPath || ''; // eslint-disable-line no-process-env, no-undef
const FULL_LAYER_PATH = path.join(process.cwd(), I3S_LAYER_PATH); // eslint-disable-line no-undef

loadArchive(FULL_LAYER_PATH)

async function getFileByUrl(url) {
  const trimmedPath = /^\/?(.*)$/.exec(url);
  let uncompressedFile;
  if (trimmedPath) {
    try {
      uncompressedFile = await parse(slpkArchive, SLPKLoader, {path: trimmedPath[1]});
    } catch (e) {
      
    }
  }
      
  if (uncompressedFile) {
    return Buffer.from(uncompressedFile);
  } else {
      return undefined;
  }
}

module.exports = {
  loadArchive,
  getFileByUrl
};
