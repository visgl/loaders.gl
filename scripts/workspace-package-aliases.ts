// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

/** An exact Vite alias for one published package entry point. */
type EntrypointAlias = {find: RegExp; replacement: string};

/** A string target or named package export conditions used by browser builds. */
type PackageExport = string | {browser?: string; import?: string; default?: string; types?: string} | null;

/** Resolves published subpaths to local sources or emitted assets for Vite. */
export function getWorkspaceEntrypointAliases(frameworkName: string, frameworkRootDirectory: string): EntrypointAlias[] {
  const modulesDirectory = resolve(frameworkRootDirectory, 'modules');
  const aliases: EntrypointAlias[] = [];
  for (const directory of readdirSync(modulesDirectory)) {
    const moduleDirectory = resolve(modulesDirectory, directory);
    const manifestPath = resolve(moduleDirectory, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (!manifest.name?.startsWith(frameworkName + '/')) continue;
    for (const [exportPath, conditions] of Object.entries<PackageExport>(manifest.exports || {})) {
      if (!exportPath.startsWith('./')) continue;
      const target =
        typeof conditions === 'string'
          ? conditions
          : conditions?.browser ?? conditions?.import ?? conditions?.default;
      if (typeof target !== 'string' || !target.startsWith('./')) continue;
      const types = typeof conditions === 'object' ? conditions?.types : undefined;
      const sourceTarget = types && (target.endsWith('.js') ? target : types);
      const sourcePath = sourceTarget?.startsWith('./dist/')
        ? resolve(moduleDirectory, sourceTarget.replace('./dist/', './src/').replace(/(?:\.d\.ts|\.js)$/, '.ts'))
        : undefined;
      const wildcard = exportPath.includes('*');
      const replacement =
        sourcePath && existsSync(wildcard ? dirname(sourcePath) : sourcePath)
          ? sourcePath
          : resolve(moduleDirectory, target);
      const specifier = manifest.name + exportPath.slice(1);
      const escaped = specifier.replace(/[.*+?^$\x7b\x7d()|[\]\\]/g, '\\$&');
      aliases.push({
        find: new RegExp('^' + escaped.replace('\\*', '(.+)') + '$'),
        replacement: wildcard ? replacement.replace('*', '$1') : replacement
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
