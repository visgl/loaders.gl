import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {Tiles3DLoader} from './tiles-3d-loader';
import {getIonTilesetMetadata} from './lib/ion/ion';

async function preload(url, options = {}) {
  options = options['cesium-ion'] || {};
  // @ts-ignore
  const {accessToken} = options;
  // @ts-ignore
  let assetId = options.assetId;
  if (!Number.isFinite(assetId)) {
    const matched = url.match(/\/([0-9]+)\/tileset.json/);
    assetId = matched && matched[1];
  }
  return getIonTilesetMetadata(accessToken, assetId);
}

/**
 * Loader for 3D tiles from Cesium ION
 */
export const CesiumIonLoader: LoaderWithParser = {
  ...Tiles3DLoader,
  id: 'cesium-ion',
  name: 'Cesium Ion',
  // @ts-ignore
  preload,
  parse: async (data, options?, context?) => {
    options = {...options};
    options['3d-tiles'] = options['cesium-ion'];
    // @ts-ignore
    options.loader = CesiumIonLoader;
    return Tiles3DLoader.parse(data, options, context); // , loader);
  },
  options: {
    'cesium-ion': {
      // @ts-expect-error
      ...Tiles3DLoader.options['3d-tiles'],
      accessToken: null
    }
  }
};
