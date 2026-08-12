// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompressedTextureWriterOptions} from '../../compressed-texture-writer';

type TextureCompressorPack = (options: Record<string, unknown>) => Promise<unknown>;

/**
 * Loads the pack function from the locally installed optional texture-compressor peer.
 */
export async function loadTextureCompressorPack(): Promise<TextureCompressorPack> {
  const packageName = 'texture-compressor';
  const textureCompressor = await import(/* @vite-ignore */ packageName);
  const pack = textureCompressor.pack || textureCompressor.default?.pack;
  if (typeof pack !== 'function') {
    throw new Error('The installed texture-compressor package does not export pack()');
  }
  return pack;
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
export async function encodeImageURLToCompressedTextureURL(
  inputUrl: string,
  outputUrl: string,
  options?: CompressedTextureWriterOptions
): Promise<string> {
  const pack = await loadTextureCompressorPack();
  await pack({
    type: 's3tc',
    compression: 'DXT1',
    quality: 'normal',
    input: inputUrl,
    output: outputUrl
  });
  return outputUrl;
}
