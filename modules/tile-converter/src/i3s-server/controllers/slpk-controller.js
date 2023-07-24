require('@loaders.gl/polyfills');
const {parseSLPK} = require('@loaders.gl/i3s');
const path = require('path');
const {FileHandleProvider} = require('@loaders.gl/tile-converter');

let slpkArchive;

const loadArchive = async (fullLayerPath) => {
  slpkArchive = await parseSLPK(await FileHandleProvider.from(fullLayerPath), (msg) =>
    console.log(msg)
  );
  console.log('Server ready to use');
};

const I3S_LAYER_PATH = process.env.I3sLayerPath || ''; // eslint-disable-line no-process-env, no-undef
const FULL_LAYER_PATH = path.join(process.cwd(), I3S_LAYER_PATH); // eslint-disable-line no-undef

loadArchive(FULL_LAYER_PATH);

async function getFileByUrl(url) {
  const trimmedPath = /^\/?(.*)\/?$/.exec(url);
  let uncompressedFile;
  if (trimmedPath) {
    try {
      uncompressedFile = Buffer.from(await slpkArchive.getFile(trimmedPath[1], 'http'));
    } catch (e) {}
  }
  return uncompressedFile;
}

module.exports = {
  loadArchive,
  getFileByUrl
};
