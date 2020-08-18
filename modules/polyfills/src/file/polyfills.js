/* global global */
import {ReadableStreamPolyfill} from './readable-stream-polyfill';
import {BlobPolyfill} from './blob-polyfill';
import {FileReaderPolyfill} from './file-reader-polyfill';
import {FilePolyfill} from './file-polyfill';

export function installFilePolyfills() {
  if (typeof ReadableStream === 'undefined' && global) {
    // @ts-ignore;
    global.ReadableStream = ReadableStreamPolyfill;
  }

  if (typeof Blob === 'undefined' && global) {
    // @ts-ignore;
    global.Blob = BlobPolyfill;
  }

  if (typeof FileReader === 'undefined' && global) {
    // @ts-ignore;
    global.FileReader = FileReaderPolyfill;
  }

  // Install minimal Node.js File polyfill
  if (typeof File === 'undefined' && global) {
    // @ts-ignore;
    global.File = FilePolyfill;
  }
}
