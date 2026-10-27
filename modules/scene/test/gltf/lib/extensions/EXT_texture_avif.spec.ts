// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {getSupportedImageFormats} from '@loaders.gl/images';

test('EXT_texture_avif detects Chromium AVIF decode support asynchronously', async () => {
  const supportedImageFormats = await getSupportedImageFormats();

  expect(supportedImageFormats).toContain('image/avif');
});
