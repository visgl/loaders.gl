"use strict";module.export({readFileSync:()=>readFileSync});// DEPRECATED

// In a few cases (data URIs, node.js) "files" can be read synchronously
function readFileSync(url, options = {}) {
  options = getReadFileOptions(options);

  if (isDataURL(url)) {
    return decodeDataUri(url);
  }

  if (!isNode) {
    return null; // throw new Error('Cant load URI synchronously');
  }

  const buffer = fs.readFileSync(url, options, () => {});
  return buffer instanceof Buffer ? toArrayBuffer(buffer) : buffer;
}
