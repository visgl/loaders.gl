import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';

export async function loadPointTile(url) {
  const content = await load(url, Tiles3DLoader);

  const tile = {
    rtc_center: content.rtcCenter, // eslint-disable-line camelcase
    points: content.attributes.positions
  };
  const {colors} = content.attributes;
  if (colors && colors.size === 3) {
    tile.rgb = colors.value;
  }
  if (colors && colors.size === 4) {
    tile.rgba = colors.value;
  }

  return tile;
}

export async function loadBatchedModelTile(url) {
  const content = await load(url, Tiles3DLoader, {
    '3d-tiles': {
      loadGLTF: false
    }
  });
  const tile = {};
  tile.glbData = content.gltfArrayBuffer;
  return tile;
}
