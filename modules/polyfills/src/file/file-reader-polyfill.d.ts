// import {BlobPolyfill} from './blob-polyfill';

export class FileReaderPolyfill {
  onload: ({result: any}) => void;
  abort();
  readAsArrayBuffer(blob: Blob): ArrayBuffer;
  readAsBinaryString(blob: Blob);
  readAsDataURL(blob: Blob);
  readAsText(blob: Blob);
}
