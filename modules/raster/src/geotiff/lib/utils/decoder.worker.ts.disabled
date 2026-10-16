import type { FileDirectory } from 'geotiff';
import { getDecoder } from 'geotiff/src/compression';

async function decode(fileDirectory: FileDirectory, buffer: ArrayBuffer) {
  const decoder = getDecoder(fileDirectory);
  const result = await decoder.decode(fileDirectory, buffer);
  self.postMessage(result, [result] as any);
}

if (typeof self !== 'undefined') {
  self.addEventListener('message', event => {
    const [name, ...args] = event.data;
    switch (name) {
      case 'decode':
        decode(args[0], args[1]);
        break;
      default:
        break;
    }
  });
}
