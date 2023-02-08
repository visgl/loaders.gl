// import {ReadableStreamPolyfill} from './readable-stream';
import {BlobPolyfill} from './blob';
import {FileReaderPolyfill} from './file-reader';
import {FilePolyfill} from './file';

export function installFilePolyfills() {
  if (typeof ReadableStream === 'undefined' && global) {
    // @ts-ignore;
    // global.ReadableStream = ReadableStreamPolyfill;
  }

  if (typeof Blob === 'undefined' && global) {
    // @ts-ignore;
    global.Blob = BlobPolyfill;
    console.error('installing Blob polyfill')
  }

  // Install minimal Node.js File polyfill
  if (typeof File === 'undefined' && global) {
    // @ts-ignore;
    global.File = FilePolyfill;
    console.error('installing File polyfill')
  }

  if (typeof FileReader === 'undefined' && global) {
    // @ts-ignore;
    global.FileReader = FileReaderPolyfill;
    console.error('installing FileReader polyfill')

  }
}
