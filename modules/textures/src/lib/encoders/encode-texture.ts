// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompressedTextureWriterOptions} from '../../compressed-texture-writer';

type TextureCompressorPack = (options: Record<string, unknown>) => Promise<unknown>;
type TextureCompressorModule = {
  pack?: TextureCompressorPack;
  default?: {pack?: TextureCompressorPack};
};
type LoadTextureCompressorModule = () => Promise<TextureCompressorModule>;
type LoadTextureCompressorPack = () => Promise<TextureCompressorPack>;
type TextureEncoder = (
  inputUrl: string,
  outputUrl: string,
  options?: CompressedTextureWriterOptions
) => Promise<string>;

/** Dynamically imports the locally installed optional texture-compressor peer. */
async function importTextureCompressor(): Promise<TextureCompressorModule> {
  const packageName = 'texture-compressor';
  return await import(/* webpackIgnore: true */ /* @vite-ignore */ packageName);
}

/**
 * Loads the pack function from the locally installed optional texture-compressor peer.
 */
export async function loadTextureCompressorPack(
  loadTextureCompressorModule: LoadTextureCompressorModule = importTextureCompressor
): Promise<TextureCompressorPack> {
  const textureCompressor = await loadTextureCompressorModule();
  const textureCompressorPack = textureCompressor.pack || textureCompressor.default?.pack;
  if (typeof textureCompressorPack !== 'function') {
    throw new Error('The installed texture-compressor package does not export pack()');
  }
  return textureCompressorPack;
}

/** Creates the compressed texture encoder with the supplied optional peer loader. */
export function createTextureEncoder(
  loadTextureCompressorPackFunction: LoadTextureCompressorPack = loadTextureCompressorPack
): TextureEncoder {
  return async (inputUrl, outputUrl, options) => {
    const textureCompressorPack = await loadTextureCompressorPackFunction();
    await textureCompressorPack({
      type: 's3tc',
      compression: 'DXT1',
      quality: 'normal',
      input: inputUrl,
      output: outputUrl
    });
    return outputUrl;
  };
}

/**
 * Compresses an image file into an S3TC/DXT1 compressed texture file, under Node.js only.
 *
 * Note: despite the writer being named `CompressedTextureWriter` / "DDS Texture Container",
 * the `texture-compressor` CLI only writes `.ktx` containers - the `outputUrl` must end
 * in `.ktx` or the CLI rejects it.
 *
 * Note: This experimental encoder calls the `texture-compressor` package, which shells out
 * to its bundled native encoder.
 * That CLI is *not* a dependency of `@loaders.gl/textures` - applications that use this
 * writer must install it themselves (`npm install --save-dev texture-compressor`) or make
 * it otherwise resolvable as an optional peer dependency. It is never downloaded on
 * demand - if it cannot be resolved, this function rejects.
 *
 * @see https://github.com/TimvanScherpenzeel/texture-compressor
 */
export const encodeImageURLToCompressedTextureURL = createTextureEncoder();
