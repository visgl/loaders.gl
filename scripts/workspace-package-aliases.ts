// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

/** An exact Vite alias for one published package entry point. */
type EntrypointAlias = {find: RegExp; replacement: string};

/** Resolves published package subpaths to their local TypeScript sources for Vite. */
export function getWorkspaceEntrypointAliases(frameworkName: string, frameworkRootDirectory: string): EntrypointAlias[] {
  const modulesDirectory = resolve(frameworkRootDirectory, 'modules');
  const aliases: EntrypointAlias[] = [];
  for (const directory of readdirSync(modulesDirectory)) {
    const moduleDirectory = resolve(modulesDirectory, directory);
    const manifestPath = resolve(moduleDirectory, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (!manifest.name?.startsWith(frameworkName + '/')) continue;
    for (const [exportPath, conditions] of Object.entries<{types?: string}>(manifest.exports || {})) {
      if (!exportPath.startsWith('./') || exportPath.includes('*')) continue;
      const target = conditions?.types;
      if (typeof target !== 'string' || !target.startsWith('./dist/') || !target.endsWith('.d.ts')) continue;
      const source = resolve(
        moduleDirectory,
        target.replace('./dist/', './src/').replace(/\.d\.ts$/, '.ts')
      );
      if (!existsSync(source)) continue;
      const specifier = manifest.name + exportPath.slice(1);
      aliases.push({
        find: new RegExp('^' + specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'),
        replacement: source
      });
    }
  }
  return aliases;
}

/** Adds package roots after exact public subpaths while retaining local deep imports. */
export function getWorkspaceSourceAliases(frameworkName: string, frameworkRootDirectory: string) {
  const modulesDirectory = resolve(frameworkRootDirectory, 'modules');
  return [
    ...getWorkspaceEntrypointAliases(frameworkName, frameworkRootDirectory),
    ...readdirSync(modulesDirectory).map(directory => ({
      find: frameworkName + '/' + directory,
      replacement: resolve(modulesDirectory, directory, 'src')
    }))
  ];
}
