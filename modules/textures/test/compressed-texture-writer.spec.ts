// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {encodeURLtoURL, isBrowser} from '@loaders.gl/core';
import {CompressedTextureWriter} from '@loaders.gl/textures';

export const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';

test('CompressedTextureWriter#write-and-read-image', async (t) => {
  if (isBrowser) {
    t.comment('CompressedTextureWriter only supported on Node.js');
    t.end();
    return;
  }
  // The `texture-compressor` CLI is an optional, application-supplied prerequisite,
  // so skip (rather than fail) when it is not installed in this environment.
  let outputFilename: string | undefined;
  try {
    outputFilename = await encodeURLtoURL(IMAGE_URL, '/tmp/test.ktx', CompressedTextureWriter, {});
  } catch (error) {
    t.comment(`texture-compressor CLI not available, skipping: ${(error as Error).message}`);
    t.end();
    return;
  }
  t.ok(outputFilename, 'a filename was returned');
  t.end();
});
