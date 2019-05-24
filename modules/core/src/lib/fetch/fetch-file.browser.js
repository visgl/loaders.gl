/* global FileReader */
import assert from '../../utils/assert';

// File reader fetch "polyfill" for the browser
class FileResponse {
  constructor(file) {
    this._file = file;
    this._promise = new Promise((resolve, reject) => {
      try {
        this._reader = new FileReader();
        this._reader.onerror = error => reject(new Error(error));
        this._reader.onabort = () => reject(new Error('Read aborted.'));
        this._reader.onload = () => resolve(this._reader.result);
      } catch (error) {
        reject(error);
      }
    });
  }

  headers() {
    return {};
  }

  url() {
    return this._file.name;
  }

  async arrayBuffer() {
    this.bodyUsed = true;
    this._reader.readAsArrayBuffer(this._file);
    return this._promise;
  }

  async text() {
    this.bodyUsed = true;
    this._reader.readAsText(this._file);
    return this._promise;
  }

  async json() {
    return JSON.parse(this.text());
  }

  get body() {
    // TODO - body, how to support stream?
    // eslint-disable-next-line
    // https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams#Creating_your_own_custom_readable_stream
    assert(false);
  }
}

// @param {File|Blob} file  HTML File or Blob object to read as string
// @returns {Promise.string}  Resolves to a string containing file contents
export default function fetchFileObject(file, options) {
  return new FileResponse(file, options);
}
