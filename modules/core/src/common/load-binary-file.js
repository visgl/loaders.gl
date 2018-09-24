import {toArrayBuffer} from './loader-utils/binary-utils';

export function loadBinaryFile(path) {
  const fs = module.require && module.require('fs');
  if (!fs) {
    return null;
  }
  const file = fs.readFileSync(path);
  return toArrayBuffer(file);
}
