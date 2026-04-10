// Simple file alias mechanisms for tests.

let pathPrefix = '';
const fileAliases: {[aliasPath: string]: string} = {};

/*
 * Set a relative path prefix
 */
export function setPathPrefix(prefix: string): void {
  pathPrefix = prefix;
}

/*
 * Get the relative path prefix
 */
export function getPathPrefix(): string {
  return pathPrefix;
}

/**
 *
 * @param aliases
 *
 * Note: addAliases are an experimental export, they are only for testing of loaders.gl loaders
 * not intended as a generic aliasing mechanism
 */
export function addAliases(aliases: {[aliasPath: string]: string}): void {
  Object.assign(fileAliases, aliases);
}

/**
 * Resolves aliases and adds path-prefix to paths
 */
export function resolvePath(filename: string): string {
  for (const alias in fileAliases) {
    if (filename.startsWith(alias)) {
      const replacement = fileAliases[alias];
      filename = filename.replace(alias, replacement);
    }
  }
  if (!filename.startsWith('http://') && !filename.startsWith('https://')) {
    filename = `${pathPrefix}${filename}`;
  }
  return filename;
}
