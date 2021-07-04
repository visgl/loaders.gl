// file write
import {isBrowser, assert, resolvePath} from '@loaders.gl/loader-utils';
import {fs, toBuffer} from '@loaders.gl/loader-utils';

export async function writeFile(
  filePath: string,
  arrayBufferOrString: ArrayBuffer | string,
  options?
): Promise<void> {
  filePath = resolvePath(filePath);
  if (!isBrowser) {
    await fs.writeFile(filePath, toBuffer(arrayBufferOrString), {flag: 'w'});
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
