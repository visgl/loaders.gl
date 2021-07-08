import {getUrlWithToken} from '../utils/url-utils';

import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {CompressedTextureLoader} from '@loaders.gl/textures';

const FORMAT_LOADER_MAP = {
  jpeg: ImageLoader,
  png: ImageLoader,
  'ktx-etc2': CompressedTextureLoader,
  dds: CompressedTextureLoader
};

export async function parseI3sTileTexture(tile, options) {
  if (tile.textureUrl) {
    const url = getUrlWithToken(tile.textureUrl, options.i3s?.token);
    const loader = FORMAT_LOADER_MAP[tile.textureFormat] || ImageLoader;
    tile.content.texture = await load(url, loader);

    if (loader === CompressedTextureLoader) {
      tile.content.texture = {
        compressed: true,
        mipmaps: false,
        width: tile.content.texture[0].width,
        height: tile.content.texture[0].height,
        data: tile.content.texture
      };
    }
  }
}
