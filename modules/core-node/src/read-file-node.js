import {
  loadAsync as browserLoadAsync,
  loadSync as browserLoadSync,
  toArrayBuffer
} from '@loaders.gl/core';

import path from 'path';
const fs = module.require && module.require('fs');

export function readFile(uri, options) {
  const promise = browserLoadAsync(uri, options);
  if (promise) {
    return promise;
  }
  const filePath = path.join(options.rootFolder, uri);
  return fs.readFileAsync(filePath).then(buffer => toArrayBuffer(buffer));
}

export function readFileSync(uri, options) {
  const promise = browserLoadSync(uri, options);
  if (promise) {
    return promise;
  }
  const file = fs.readFileSync(path);
  return toArrayBuffer(file);
}
