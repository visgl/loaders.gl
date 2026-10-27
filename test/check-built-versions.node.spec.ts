// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, expect, test} from 'vitest';
import {checkBuiltVersions} from '../scripts/check-built-versions.mjs';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, {recursive: true, force: true});
});

test('checks compiled worker versions against the version being published', () => {
  const root = mkdtempSync(join(tmpdir(), 'loaders-versions-'));
  temporaryDirectories.push(root);
  const moduleDirectory = join(root, 'example');
  mkdirSync(join(moduleDirectory, 'src'), {recursive: true});
  mkdirSync(join(moduleDirectory, 'dist'), {recursive: true});
  writeFileSync(join(moduleDirectory, 'package.json'), JSON.stringify({version: '5.0.0-alpha.15'}));
  writeFileSync(
    join(moduleDirectory, 'src', 'loader.ts'),
    "const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';"
  );
  const outputPath = join(moduleDirectory, 'dist', 'loader.js');
  writeFileSync(
    outputPath,
    'const VERSION = typeof "5.0.0-alpha.14" !== \'undefined\' ? "5.0.0-alpha.14" : \'latest\';'
  );
  expect(checkBuiltVersions(root).errors).toEqual([
    expect.stringContaining('5.0.0-alpha.14 does not match 5.0.0-alpha.15')
  ]);
  writeFileSync(
    outputPath,
    'const VERSION = typeof "5.0.0-alpha.15" !== \'undefined\' ? "5.0.0-alpha.15" : \'latest\';'
  );
  expect(checkBuiltVersions(root)).toEqual({checked: 1, errors: []});
});
