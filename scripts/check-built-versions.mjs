#!/usr/bin/env node
// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Verify version-inline output for source files that define loader or worker versions. */
export function checkBuiltVersions(modulesDirectory) {
  const errors = [];
  let checked = 0;
  for (const moduleEntry of fs.readdirSync(modulesDirectory, {withFileTypes: true})) {
    if (!moduleEntry.isDirectory()) continue;
    const moduleDirectory = path.join(modulesDirectory, moduleEntry.name);
    const packagePath = path.join(moduleDirectory, 'package.json');
    const sourceDirectory = path.join(moduleDirectory, 'src');
    if (!fs.existsSync(packagePath) || !fs.existsSync(sourceDirectory)) continue;
    const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (manifest.private) continue;
    for (const sourcePath of listSourceFiles(sourceDirectory)) {
      const source = fs.readFileSync(sourcePath, 'utf8');
      if (!/^\s*(?:(?:export\s+)?const\s+\w+\s*=\s*typeof\s+__VERSION__|if\s*\(\s*typeof\s+__VERSION__)/m.test(source)) continue;
      const outputPath = path.join(moduleDirectory, 'dist', path.relative(sourceDirectory, sourcePath).replace(/\.ts$/, '.js'));
      if (!fs.existsSync(outputPath)) {
        errors.push(`${outputPath}: missing compiled version-bearing file`);
        continue;
      }
      const output = fs.readFileSync(outputPath, 'utf8');
      const version = /(?:const\s+\w+\s*=\s*typeof|if\s*\(\s*typeof)\s*["']([^"']+)["']/.exec(output)?.[1];
      if (version !== manifest.version) {
        errors.push(`${outputPath}: embedded version ${version || 'missing'} does not match ${manifest.version}`);
      }
      checked++;
    }
  }
  return {checked, errors};
}

/** Recursively lists TypeScript source files. */
function listSourceFiles(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') ? [entryPath] : [];
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const {checked, errors} = checkBuiltVersions(path.resolve('modules'));
  if (!checked) errors.push('No embedded versions were checked; build published modules first');
  for (const error of errors) console.error(error);
  if (errors.length) process.exitCode = 1;
  else console.log(`Verified ${checked} built module versions against package manifests.`);
}
