// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fileSystem from 'node:fs';
import path from 'node:path';
import {expect, test} from 'vitest';

const REPOSITORY_ROOT = process.cwd();
const MODULE_NAMES = [
  'archives',
  'core',
  'geospatial',
  'ogc',
  'pointclouds',
  'raster',
  'scene',
  'tables',
  'tiles',
  'tiles-3d'
];
const ENTRYPOINT_NAME = /(?:loader|writer|source)(?:-types)?$/;

test.each(
  MODULE_NAMES
)('%s exposes named loader, writer, and source entrypoints at package level', moduleName => {
  const moduleDirectory = path.join(REPOSITORY_ROOT, 'modules', moduleName);
  const manifest = JSON.parse(
    fileSystem.readFileSync(path.join(moduleDirectory, 'package.json'), 'utf8')
  );
  const exports = manifest.exports as Record<string, string | Record<string, string>>;

  const nestedEntrypoints = Object.keys(exports).filter(exportPath => {
    if (!exportPath.startsWith('./')) return false;
    const segments = exportPath.slice(2).split('/');
    return segments.length === 2 && ENTRYPOINT_NAME.test(segments[1]);
  });
  expect(nestedEntrypoints, moduleName).toEqual([]);

  const flatEntrypoints = Object.entries(exports).filter(([exportPath]) => {
    if (!exportPath.startsWith('./')) return false;
    const segments = exportPath.slice(2).split('/');
    return segments.length === 1 && ENTRYPOINT_NAME.test(segments[0]);
  });
  expect(flatEntrypoints.length, moduleName).toBeGreaterThan(0);

  for (const [exportPath, conditions] of flatEntrypoints) {
    const targets = typeof conditions === 'string' ? [conditions] : Object.values(conditions);
    for (const target of targets) {
      expect(
        fileSystem.existsSync(path.join(moduleDirectory, target)),
        moduleName + exportPath + ': ' + target
      ).toBe(true);
    }
  }
});
