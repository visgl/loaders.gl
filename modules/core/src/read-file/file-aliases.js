// Simple file alias mechanism for tests. Usage:
//
// addFileAliases(TEST_DATA_DIR, {
//   'img1-preview.png': isBrowser && require('../../data/images/img1-preview.png'),
//   'img1-preview.jpeg': isBrowser && require('../../data/images/img1-preview.jpeg'),
//   'img1-preview.gif': isBrowser && require('../../data/images/img1-preview.gif'),
//   'img1-preview.bmp': isBrowser && require('../../data/images/img1-preview.bmp'),
//   'img1-preview.tiff': isBrowser && require('../../data/images/img1-preview.tiff')
// });

const fileAliases = {};

export function addFileAliases(path, aliases) {
  for (const key in aliases) {
    const data = aliases[key];
    if (data) {
      // Concatenate path
      const filename = `${path}/${key}`.replace('//', '/');
      fileAliases[filename] = aliases[key];
    }
  }
}

export function getFileAlias(uri) {
  return fileAliases[uri];
}
