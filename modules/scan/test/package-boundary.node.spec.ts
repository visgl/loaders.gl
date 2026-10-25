// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

const packageDirectory = fileURLToPath(new URL('../', import.meta.url));

test('scan has no table-format package dependency or forwarding subpaths', () => {
  const manifest = JSON.parse(readFileSync(`${packageDirectory}/package.json`, 'utf8'));
  expect(manifest.dependencies).not.toHaveProperty('@loaders.gl/tables');
  expect(manifest.exports).not.toHaveProperty('./iceberg');
  expect(manifest.exports).not.toHaveProperty('./delta');
  expect(manifest.exports).not.toHaveProperty('./hudi');

  for (const filename of readdirSync(`${packageDirectory}/src`)) {
    if (filename.endsWith('.ts')) {
      expect(readFileSync(`${packageDirectory}/src/${filename}`, 'utf8')).not.toContain(
        '@loaders.gl/tables'
      );
    }
  }
});
