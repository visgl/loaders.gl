require('@loaders.gl/polyfills');
const {fetchFile, parse} = require('@loaders.gl/core');
const {SLPKLoader} = require('@loaders.gl/i3s');

const initController = (datasetPath) => {
  let slpkArchive;

  const loadArchive = async (fullLayerPath) => {
    slpkArchive = await (await fetchFile(fullLayerPath)).arrayBuffer();
  };

  loadArchive(datasetPath);

  async function getFileByUrl(url) {
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

  return {
    loadArchive,
    getFileByUrl
  };
};

module.exports = {
  initController
};
