#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fileSystem from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const creditsPath = path.join(repositoryRoot, 'docs/references-and-credits.md');
const credits = fileSystem.readFileSync(creditsPath, 'utf8');
const failures = [];
let packageCount = 0;

for (const packageGroup of ['modules', 'apps']) {
  const packageGroupRoot = path.join(repositoryRoot, packageGroup);
  if (!fileSystem.existsSync(packageGroupRoot)) continue;
  for (const entry of fileSystem.readdirSync(packageGroupRoot, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const packageRoot = path.join(packageGroupRoot, entry.name);
    const manifestPath = path.join(packageRoot, 'package.json');
    if (!fileSystem.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fileSystem.readFileSync(manifestPath, 'utf8'));
    if (manifest.private) continue;
    packageCount++;

    for (const filename of ['LICENSE', 'THIRD-PARTY-NOTICES.md']) {
      if (!fileSystem.existsSync(path.join(packageRoot, filename))) {
        failures.push(`${manifest.name}: missing ${filename}`);
      }
      if (!manifest.files?.includes(filename)) {
        failures.push(`${manifest.name}: files must explicitly include ${filename}`);
      }
    }
    if (!credits.includes(`/${packageGroup}/${entry.name}/THIRD-PARTY-NOTICES.md`)) {
      failures.push(`${manifest.name}: missing central credits entry`);
    }

    const noticePath = path.join(packageRoot, 'THIRD-PARTY-NOTICES.md');
    if (!fileSystem.existsSync(noticePath)) continue;
    const notice = fileSystem.readFileSync(noticePath, 'utf8');
    for (const match of notice.matchAll(/\]\((\.\.?\/[^)#]+)(?:#[^)]*)?\)/g)) {
      const relativePath = decodeURIComponent(match[1]);
      const targetPath = path.resolve(packageRoot, relativePath);
      if (!targetPath.startsWith(`${packageRoot}${path.sep}`)) {
        failures.push(`${manifest.name}: notice link escapes package: ${relativePath}`);
      } else if (!fileSystem.existsSync(targetPath)) {
        failures.push(`${manifest.name}: broken notice link: ${relativePath}`);
      } else if (
        !manifest.files?.some(
          filename =>
            relativePath.slice(2) === filename || relativePath.slice(2).startsWith(`${filename}/`)
        )
      ) {
        failures.push(`${manifest.name}: notice target omitted from files: ${relativePath}`);
      }
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Attribution indexes, local notice links and package file declarations checked for ${packageCount} published packages.`);
  console.log('This structural check does not establish complete historical provenance or audit transitive dependencies.');
}
