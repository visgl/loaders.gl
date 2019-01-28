import {toBuffer} from '@loaders.gl/core';

export function saveBinaryFile(filePath, arrayBuffer) {
  const fs = module.require('fs');
  fs.writeFileSync(`${filePath}`, toBuffer(arrayBuffer), {flag: 'w'});
}
