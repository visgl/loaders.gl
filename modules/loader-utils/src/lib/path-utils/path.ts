// Beginning of a minimal implementation of the Node.js path API, that doesn't pull in big polyfills.

/**
 * Replacement for Node.js path.dirname
 * @param url
 */
export function dirname(url: string): string {
  const slashIndex = url && url.lastIndexOf('/');
  return slashIndex >= 0 ? url.substr(0, slashIndex as number) : '';
}

/**
 * Replacement for Node.js path.join
 * @param parts
 */
export function join(...parts: string[]): string {
  const separator = '/';
  parts = parts.map((part, index) => {
    if (index) {
      part = part.replace(new RegExp(`^${separator}`), '');
    }
    if (index !== parts.length - 1) {
      part = part.replace(new RegExp(`${separator}$`), '');
    }
    return part;
  });
  return parts.join(separator);
}
