import Tiles3DLoader from './tiles-3d-loader';
import {getIonTilesetMetadata} from './lib/ion/ion';

async function preload(url, options = {}) {
  options = options['cesium-ion'] || {};
  const {accessToken} = options;
  let assetId = options.assetId;
  if (!Number.isFinite(assetId)) {
    const matched = url.match(/\/([0-9]+)\/tileset.json/);
    assetId = matched && matched[1];
  }
  return getIonTilesetMetadata(accessToken, assetId);
}

const CesiumIonLoader = {
  ...Tiles3DLoader,
  id: 'cesium-ion',
  name: 'Cesium Ion',
  preload,
  parse: async (data, options, context, loader) => {
    options['3d-tiles'] = options['cesium-ion'];
    options.loader = CesiumIonLoader;
    return Tiles3DLoader.parse(data, options, context); // , loader);
  },
  options: {
    'cesium-ion': {
      ...Tiles3DLoader.options['3d-tiles'],
      accessToken: null
    }
  }
};

export default CesiumIonLoader;
