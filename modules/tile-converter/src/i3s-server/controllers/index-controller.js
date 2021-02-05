const path = require('path');
const fs = require('fs');

const {promises} = fs;

const I3S_LAYER_PATH = process.env.I3sLayerPath || ''; // eslint-disable-line no-process-env, no-undef
const FULL_LAYER_PATH = path.join(process.cwd(), I3S_LAYER_PATH); // eslint-disable-line no-undef

async function getFileNameByUrl(url) {
  const extensions = ['json', 'bin', 'jpg', 'jpeg', 'png', 'bin.dds'];
  for (const ext of extensions) {
    const fileName = `${FULL_LAYER_PATH}${url}/index.${ext}`;
    try {
      await promises.access(fileName);
      return fileName;
    } catch {
      continue; // eslint-disable-line no-continue
    }
  }
  return null;
}

module.exports = {
  getFileNameByUrl
};
