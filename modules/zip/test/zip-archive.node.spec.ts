// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {expect, test} from 'vitest';

/** Node package consumers can load the installed ESM and CommonJS roots. */
test('installed ESM/CJS ZIP entrypoints expose the portable archive reader', async () => {
  const require = createRequire(import.meta.url);
  const entrypointUrl = new URL('./index.js', pathToFileURL(require.resolve('@loaders.gl/zip')));
  const modules = [await import(entrypointUrl.href), require('@loaders.gl/zip')];
  const bytes = new Uint8Array(readFileSync(new URL('./fixtures/python.zip', import.meta.url)));
  for (const module of modules) {
    const archive = await module.openZipArchive(bytes);
    try {
      for (const path of ['folder/abc.txt', 'café.txt']) {
        expect(new TextDecoder().decode(await archive.read(path))).toBe('abc');
      }
    } finally {
      await archive.close();
    }
  }
});
