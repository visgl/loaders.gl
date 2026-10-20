// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import '@loaders.gl/core/polyfills';
import {expect, test} from 'vitest';
import {composeHashFile, openZipArchive} from '@loaders.gl/zip';
import {NodeFile} from '@loaders.gl/core/loader-utils';

/** Retains qualification against the existing independent SLPK path/index profile. */
test('ZIP composes the legacy SLPK index from shared reader entries', async () => {
  const archive = await openZipArchive(
    new NodeFile('modules/tiles-3d/test/i3s/data/DA12_subset.slpk')
  );
  try {
    expect((await composeHashFile(archive.entries())).byteLength).toBe(6888);
  } finally {
    await archive.close();
  }
});
