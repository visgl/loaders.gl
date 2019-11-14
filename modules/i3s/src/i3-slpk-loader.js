/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
import ZipLoader from 'zip-loader';
import pako from 'pako';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const I3SSLPKLoader = {
  id: 'i3s-slpk',
  name: 'i3s-slpk',
  version: VERSION,
  extensions: ['slpk'],
  mimeType: 'application/octet-stream',
  parse: parseSlpkAsync,
  binary: true,
  options: {}
};

async function parseSlpkAsync(data, options) {
  const loader = new ZipLoader(data);
  await loader.load();

  const files = loader.files;
  for (const fileName in files) {
    const fileContent = files[fileName];
    const types = fileName.split('.');
    const fileType = types[types.length - 1];

    switch (fileType) {
      case 'gz':
        const subType = types[types.length - 2];
        if (subType === 'json') {
          files[fileName] = JSON.parse(pako.inflate(fileContent.buffer, {to: 'string'}));
        } else if (subType === 'bin') {
          files[fileName] = pako.inflate(fileContent.buffer);
        } else {
          // eslint-disable-next-line
          console.error('unrecognized sub type', subType);
        }
        break;
      case 'json':
        files[fileName] = loader.extractAsJSON(fileName);
        break;
      default:
        // eslint-disable-next-line
        console.error('unrecognized file type', fileType);
    }
  }

  const layerMeta = loader.files['3dSceneLayer.json.gz'];
  const metadata = loader.files['metadata.json.gz'];
  const nodes = loader.files['nodepages/0.json.gz'];
  const root = loader.files['nodes/root/3dNodeIndexDocument.json.gz'];

  loader.tilesetJson = {
    ...metadata,
    ...layerMeta,
    nodes,
    root
  };

  return loader;
}
