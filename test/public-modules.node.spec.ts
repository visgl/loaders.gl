// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';
import {expect, test} from 'vitest';

const publishedModules = findPublishedModules();

test.each(publishedModules)('$name exposes a public package root', publishedModule => {
  expect(publishedModule.packageJson.exports?.['.']).toBeTruthy();
  expect(fs.existsSync(path.join(publishedModule.directory, 'src/index.ts'))).toBe(true);
});

/** Discovers non-private published packages for lightweight Node compatibility checks. */
function findPublishedModules() {
  const modulesDirectory = path.resolve('modules');
  const modules = [];

  for (const directoryName of fs.readdirSync(modulesDirectory).sort()) {
    const directory = path.join(modulesDirectory, directoryName);
    const packagePath = path.join(directory, 'package.json');
    if (!fs.existsSync(packagePath)) {
      continue;
    }
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!packageJson.private) {
      modules.push({name: packageJson.name, directory, packageJson});
    }
  }
  return modules;
}
