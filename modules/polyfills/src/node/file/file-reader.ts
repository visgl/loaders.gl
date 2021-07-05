import {atob} from '../buffer/btoa.node';

export class FileReaderPolyfill implements FileReader {
  // onload: ({result: any}) => void;
  onload;
  onabort;
  onerror;
  error;
  onloadstart;
  onloadend;
  onprogress;

  readyState;
  result;
  DONE;
  EMPTY;
  LOADING;
  addEventListener;
  removeEventListener;
  dispatchEvent;

  constructor() {
    this.onload = null;
  }

  abort(): void {
    return;
  }

  async readAsArrayBuffer(blob: Blob): Promise<void> {
    const arrayBuffer = await blob.arrayBuffer();
    if (this.onload) {
      this.onload({target: {result: arrayBuffer}});
    }
  }

  async readAsBinaryString(blob) {
    throw Error('Not implemented');
  }

  async readAsDataURL(blob) {
    const text = await blob.text();
    const dataUrl = `data://;base64,${atob(text)}`;
    if (this.onload) {
      this.onload({target: {result: dataUrl}});
    }
  }

  async readAsText(blob) {
    const text = await blob.text();
    if (this.onload) {
      this.onload({target: {result: text}});
    }
  }
}
