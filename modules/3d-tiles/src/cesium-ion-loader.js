import Tiles3DLoader from './tiles-3d-loader';
import {getIonTilesetMetadata} from './lib/ion/ion';

async function preload(url, options) {
  console.log(url, options);
  options = options.ion || {};
  const {accessToken} = options;
  let assetId = options.assetId;
  if (!Number.isFinite(assetId)) {
    const matched = url.match(/\/([0-9]+)\/tileset.json/);
    assetId = matched && matched[1];
  }
  const metadata = getIonTilesetMetadata(accessToken, assetId);
  return {ion: metadata};
}

export default {
  ...Tiles3DLoader,
  id: 'ion',
  name: 'ION',
  preload
};
