// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';

const packageDirectory = fileURLToPath(new URL('../../', import.meta.url));

test('scan has no table-format package dependency or forwarding subpaths', () => {
  const manifest = JSON.parse(readFileSync(`${packageDirectory}/package.json`, 'utf8'));
  expect(manifest.dependencies).not.toHaveProperty('@loaders.gl/tables');
  expect(manifest.exports).not.toHaveProperty('./iceberg');
  expect(manifest.exports).not.toHaveProperty('./delta');
  expect(manifest.exports).not.toHaveProperty('./hudi');

  for (const filename of readdirSync(`${packageDirectory}/src/scan`)) {
    if (filename.endsWith('.ts')) {
      expect(readFileSync(`${packageDirectory}/src/scan/${filename}`, 'utf8')).not.toContain(
        '@loaders.gl/tables'
      );
    }
  }
});

test('canonical query entry points resolve and retired aliases are rejected', () => {
  const requireModule = createRequire(import.meta.url);
  expect(requireModule('@loaders.gl/core/query').query).toBeTypeOf('function');
  expect(requireModule('@loaders.gl/core/query/sql').parseSQLQuery).toBeTypeOf('function');
  const retiredSpecifiers = [
    '@loaders.gl/core/scan',
    '@loaders.gl/core/scan/arrow-query',
    '@loaders.gl/core/query/query',
    '@loaders.gl/raster/terrain/index',
    '@loaders.gl/tables/parquet-worker.js'
  ];
  for (const specifier of retiredSpecifiers) {
    expect(() => requireModule.resolve(specifier)).toThrow(
      expect.objectContaining({code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'})
    );
  }

  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import assert from 'node:assert/strict';
        for (const specifier of process.argv.slice(1)) {
          await assert.rejects(import(specifier), {code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'});
        }`,
      ...retiredSpecifiers
    ],
    {cwd: packageDirectory}
  );
});
