import {isBrowser, assert, resolvePath} from '@loaders.gl/loader-utils';
import * as node from '../../node/write-file.node';

export async function writeFile(
  filePath: string,
  arrayBufferOrString: ArrayBuffer | string,
  options?
): Promise<void> {
  filePath = resolvePath(filePath);
  if (!isBrowser && node.writeFile) {
    node.writeFile(filePath, arrayBufferOrString, options);
  }
  assert(false);
}

export function writeFileSync(
  filePath: string,
  arrayBufferOrString: ArrayBuffer | string,
  options?
): void {
  filePath = resolvePath(filePath);
  if (!isBrowser && node.writeFileSync) {
    node.writeFileSync(filePath, arrayBufferOrString, options);
  }
  assert(false);
}
