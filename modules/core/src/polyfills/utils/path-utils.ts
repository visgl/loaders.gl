// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

let pathPrefix = '';
const fileAliases = new Map<string, string>();

/** Set the prefix applied to local paths used by Node polyfills. */
export function setPathPrefix(prefix: string): void {
  pathPrefix = prefix;
}

/** Register local path aliases used by Node polyfills. */
export function addAliases(aliases: Record<string, string>): void {
  for (const [alias, replacement] of Object.entries(aliases)) {
    fileAliases.set(alias, replacement);
  }
}

/** Resolve a local path using the polyfills path aliases and prefix. */
export function resolvePath(filename: string): string {
  for (const [alias, replacement] of fileAliases) {
    if (filename.startsWith(alias)) {
      filename = filename.replace(alias, replacement);
    }
  }
  if (!filename.startsWith('http://') && !filename.startsWith('https://')) {
    filename = `${pathPrefix}${filename}`;
  }
  return filename;
}
