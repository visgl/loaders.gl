// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ChildProcessProxy} from '@loaders.gl/worker-utils';
import {CompressedTextureWriterOptions} from '../../compressed-texture-writer';

/**
 * Compresses an image file into an S3TC/DXT1 compressed texture file, under Node.js only.
 *
 * Note: despite the writer being named `CompressedTextureWriter` / "DDS Texture Container",
 * the `texture-compressor` CLI only writes `.ktx` containers - the `outputUrl` must end
 * in `.ktx` or the CLI rejects it.
 *
 * Note: This is an experimental encoder that shells out to the `texture-compressor` CLI.
 * That CLI is *not* a dependency of `@loaders.gl/textures` - applications that use this
 * writer must install it themselves (`npm install --save-dev texture-compressor`) or make
 * it otherwise resolvable by `npx`. It is never downloaded on demand - if it cannot be
 * resolved, this function rejects.
 *
 * @see https://github.com/TimvanScherpenzeel/texture-compressor
 */
export async function encodeImageURLToCompressedTextureURL(
  inputUrl: string,
  outputUrl: string,
  options?: CompressedTextureWriterOptions
): Promise<string> {
  // biome-ignore format: preserve intentional fixture layout
  const args = [
    // Note: our actual executable is `npx`, so `texture-compressor` is an argument.
    // `--no` prevents npx from silently downloading the CLI at runtime: it must already
    // be installed by the application.
    '--no',
    // `--` is required: without it npm parses the flags below as its own config
    // instead of forwarding them to the CLI.
    '--',
    'texture-compressor',
    '--type', 's3tc',
    '--compression', 'DXT1',
    '--quality', 'normal',
    '--input', inputUrl,
    '--output', outputUrl
  ];
  const childProcess = new ChildProcessProxy();
  await childProcess.start({
    command: 'npx',
    arguments: args,
    spawn: options
  });
  return outputUrl;
}
