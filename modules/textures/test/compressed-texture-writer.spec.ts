// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encodeURLtoURL, isBrowser} from '@loaders.gl/core';
import {CompressedTextureWriter} from '@loaders.gl/textures';
import {createTextureEncoder, loadTextureCompressorPack} from '../src/lib/encoders/encode-texture';
export const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';
/** Returns whether an error specifically reports that texture-compressor is missing. */
function isTextureCompressorMissing(error: unknown): boolean {
  const moduleError = error as {
    code?: string;
    message?: string;
  };
  const isMissingModuleError =
    moduleError.code === 'MODULE_NOT_FOUND' || moduleError.code === 'ERR_MODULE_NOT_FOUND';
  const message = moduleError.message || '';
  const nodeErrorNamesTextureCompressor =
    /^Cannot find module ['"]texture-compressor['"]/.test(message) ||
    /^Cannot find package ['"]texture-compressor['"]/.test(message);
  const viteErrorNamesTextureCompressor = /^Could not resolve ['"]texture-compressor['"]/.test(
    message
  );
  return (
    (isMissingModuleError && nodeErrorNamesTextureCompressor) || viteErrorNamesTextureCompressor
  );
}
/** Returns whether the optional texture-compressor CLI is available locally. */
async function isTextureCompressorAvailable(): Promise<boolean> {
  try {
    await loadTextureCompressorPack();
    return true;
  } catch (error) {
    if (isTextureCompressorMissing(error)) {
      return false;
    }
    throw error;
  }
}
test('loadTextureCompressorPack resolves supported module exports', async () => {
  const directPack = async () => {};
  const defaultPack = async () => {};
  expect(
    await loadTextureCompressorPack(async () => ({pack: directPack})),
    'resolves a named pack export'
  ).toBe(directPack);
  expect(
    await loadTextureCompressorPack(async () => ({default: {pack: defaultPack}})),
    'resolves a default pack export'
  ).toBe(defaultPack);
  await expect(
    loadTextureCompressorPack(async () => ({})),
    'rejects an invalid module export'
  ).rejects.toThrow(/does not export pack\(\)/);
});
test('createTextureEncoder passes compression options to texture-compressor', async () => {
  let receivedOptions: Record<string, unknown> | undefined;
  const encodeTexture = createTextureEncoder(async () => async options => {
    receivedOptions = options;
  });
  const outputUrl = await encodeTexture('input.png', 'output.ktx');
  expect(outputUrl, 'returns the output URL').toBe('output.ktx');
  expect(receivedOptions, 'passes the expected compression options').toEqual({
    type: 's3tc',
    compression: 'DXT1',
    quality: 'normal',
    input: 'input.png',
    output: 'output.ktx'
  });
});
test('isTextureCompressorMissing only accepts a missing optional peer', () => {
  expect(
    isTextureCompressorMissing({
      code: 'ERR_MODULE_NOT_FOUND',
      message: "Cannot find package 'texture-compressor' imported from encode-texture.ts"
    }),
    'recognizes the missing optional peer'
  ).toBeTruthy();
  expect(
    isTextureCompressorMissing({
      code: 'MODULE_NOT_FOUND',
      message:
        "Cannot find module 'missing-transitive-package'\nRequire stack:\n- node_modules/texture-compressor/index.js"
    }),
    'does not hide a missing transitive dependency'
  ).toBeFalsy();
});
test('CompressedTextureWriter#write-and-read-image', async () => {
  if (isBrowser) {
    console.log('CompressedTextureWriter only supported on Node.js');
    return;
  }
  // The `texture-compressor` CLI is an optional, application-supplied prerequisite,
  // so skip (rather than fail) when it is not installed in this environment.
  if (!(await isTextureCompressorAvailable())) {
    console.log('texture-compressor CLI not available locally, skipping');
    return;
  }
  const outputFilename = await encodeURLtoURL(
    IMAGE_URL,
    '/tmp/test.ktx',
    CompressedTextureWriter,
    {}
  );
  expect(outputFilename, 'a filename was returned').toBeTruthy();
});
