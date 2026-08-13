// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {encodeURLtoURL, isBrowser} from '@loaders.gl/core';
import {CompressedTextureWriter} from '@loaders.gl/textures';
import {createTextureEncoder, loadTextureCompressorPack} from '../src/lib/encoders/encode-texture';

export const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';

/** Returns whether an error specifically reports that texture-compressor is missing. */
function isTextureCompressorMissing(error: unknown): boolean {
  const moduleError = error as {code?: string; message?: string};
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

test('loadTextureCompressorPack resolves supported module exports', async t => {
  const directPack = async () => {};
  const defaultPack = async () => {};

  t.equal(
    await loadTextureCompressorPack(async () => ({pack: directPack})),
    directPack,
    'resolves a named pack export'
  );
  t.equal(
    await loadTextureCompressorPack(async () => ({default: {pack: defaultPack}})),
    defaultPack,
    'resolves a default pack export'
  );
  await t.rejects(
    loadTextureCompressorPack(async () => ({})),
    /does not export pack\(\)/,
    'rejects an invalid module export'
  );
  t.end();
});

test('createTextureEncoder passes compression options to texture-compressor', async t => {
  let receivedOptions: Record<string, unknown> | undefined;
  const encodeTexture = createTextureEncoder(async () => async options => {
    receivedOptions = options;
  });

  const outputUrl = await encodeTexture('input.png', 'output.ktx');

  t.equal(outputUrl, 'output.ktx', 'returns the output URL');
  t.deepEqual(
    receivedOptions,
    {
      type: 's3tc',
      compression: 'DXT1',
      quality: 'normal',
      input: 'input.png',
      output: 'output.ktx'
    },
    'passes the expected compression options'
  );
  t.end();
});

test('isTextureCompressorMissing only accepts a missing optional peer', t => {
  t.ok(
    isTextureCompressorMissing({
      code: 'ERR_MODULE_NOT_FOUND',
      message: "Cannot find package 'texture-compressor' imported from encode-texture.ts"
    }),
    'recognizes the missing optional peer'
  );
  t.notOk(
    isTextureCompressorMissing({
      code: 'MODULE_NOT_FOUND',
      message:
        "Cannot find module 'missing-transitive-package'\nRequire stack:\n- node_modules/texture-compressor/index.js"
    }),
    'does not hide a missing transitive dependency'
  );
  t.end();
});

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
