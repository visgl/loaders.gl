import {toBuffer} from '../loader-utils/binary-utils';

export function saveBinaryFile(filePath, arrayBuffer) {
  const fs = module.require('fs');
  fs.writeFileSync(`${filePath}`, toBuffer(arrayBuffer), {flag: 'w'});
}
