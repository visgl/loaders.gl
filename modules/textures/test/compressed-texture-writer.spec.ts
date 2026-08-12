// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {encodeURLtoURL, isBrowser} from '@loaders.gl/core';
import {CompressedTextureWriter} from '@loaders.gl/textures';
import {loadTextureCompressorPack} from '../src/lib/encoders/encode-texture';

export const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';

/** Returns whether the optional texture-compressor CLI is available locally. */
async function isTextureCompressorAvailable(): Promise<boolean> {
  try {
    await loadTextureCompressorPack();
    return true;
  } catch (error) {
    const moduleError = error as {code?: string; message?: string};
    const isMissingModule =
      moduleError.code === 'MODULE_NOT_FOUND' ||
      moduleError.code === 'ERR_MODULE_NOT_FOUND' ||
      moduleError.message?.includes('Could not resolve "texture-compressor"') ||
      moduleError.message?.includes("Cannot find package 'texture-compressor'");
    if (isMissingModule) {
      return false;
    }
    throw error;
  }
}

test('CompressedTextureWriter#write-and-read-image', async t => {
  if (isBrowser) {
    t.comment('CompressedTextureWriter only supported on Node.js');
    t.end();
    return;
  }
  // The `texture-compressor` CLI is an optional, application-supplied prerequisite,
  // so skip (rather than fail) when it is not installed in this environment.
  if (!(await isTextureCompressorAvailable())) {
    t.comment('texture-compressor CLI not available locally, skipping');
    t.end();
    return;
  }
  const outputFilename = await encodeURLtoURL(
    IMAGE_URL,
    '/tmp/test.ktx',
    CompressedTextureWriter,
    {}
  );
  t.ok(outputFilename, 'a filename was returned');
  t.end();
});
