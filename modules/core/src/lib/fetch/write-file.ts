// file write
import {isBrowser, assert, resolvePath} from '@loaders.gl/loader-utils';
import {toBuffer} from '@loaders.gl/loader-utils';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

export async function writeFile(
  filePath: string,
  arrayBufferOrString: ArrayBuffer | string,
  options?
): Promise<void> {
  filePath = resolvePath(filePath);
  if (!isBrowser) {
    await fsPromises.writeFile(filePath, toBuffer(arrayBufferOrString), {flag: 'w'});
  }
  assert(false);
}

export function writeFileSync(
  filePath: string,
  arrayBufferOrString: ArrayBuffer | string,
  options?
): void {
  filePath = resolvePath(filePath);
  if (!isBrowser) {
    fs.writeFileSync(filePath, toBuffer(arrayBufferOrString), {flag: 'w'});
  }
  assert(false);
}
