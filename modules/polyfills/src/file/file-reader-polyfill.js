import {atob} from '../text-encoding/btoa.node';

export class FileReaderPolyfill {
  constructor() {
    this.onload = null;
  }

  abort() {}

  async readAsArrayBuffer(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    if (this.onload) {
      this.onload({result: arrayBuffer});
    }
  }

  readAsBinaryString(blob) {
    throw Error('Not implemented');
  }

  async readAsDataURL(blob) {
    const text = await blob.text();
    const dataUrl = `data://;base64,${atob(text)}`;
    if (this.onload) {
      this.onload({result: dataUrl});
    }
  }

  async readAsText(blob) {
    const text = await blob.text();
    if (this.onload) {
      this.onload({result: text});
    }
  }
}
