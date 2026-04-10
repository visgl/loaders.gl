// loaders.gl MIT license

export function getCWD() {
  if (typeof process !== 'undefined' && typeof process.cwd !== 'undefined') {
    return process.cwd();
  }
  const pathname = window.location?.pathname;
  return pathname?.slice(0, pathname.lastIndexOf('/') + 1) || '';
}
