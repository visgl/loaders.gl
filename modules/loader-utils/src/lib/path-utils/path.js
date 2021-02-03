// Beginning of a minimal implementation of the Node.js path API, that doesn't pull in big polyfills.
export function dirname(url) {
  const slashIndex = url && url.lastIndexOf('/');
  return slashIndex >= 0 ? url.substr(0, slashIndex) : '';
}

export function join(...parts) {
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
