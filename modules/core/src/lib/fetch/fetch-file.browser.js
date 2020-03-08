/* global FileReader, Headers */
import {assert} from '@loaders.gl/loader-utils';

// File reader fetch "polyfill" for the browser
class FileReadableResponse {
  constructor(fileOrBlob, options) {
    this._fileOrBlob = fileOrBlob;
    this.bodyUsed = false;
  }

  get headers() {
    return new Headers({
      'Content-Length': this._fileOrBlob.size,
      'Content-Type': this._fileOrBlob.type
    });
  }

  get ok() {
    return true; // Blob & File objects are already in memory
  }

  get status() {
    return 200; // Blob & File objects are already in memory
  }

  get url() {
    // Note: This is just the file name without path information
    // Note: File has `name` field but the Blob baseclass does not
    return this._fileOrBlob.name || '';
  }

  async arrayBuffer() {
    const {reader, promise} = this._getFileReader();
    reader.readAsArrayBuffer(this._fileOrBlob);
    return promise;
  }

  async text() {
    const {reader, promise} = this._getFileReader();
    reader.readAsText(this._fileOrBlob);
    return promise;
  }

  async json() {
    const text = await this.text();
    return JSON.parse(text);
  }

  // TODO - body, how to support stream?
  // Can this be portable?
  // eslint-disable-next-line
  // https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams#Creating_your_own_custom_readable_stream
  // get body() {
  //   assert(false);
  // }

  // PRIVATE

  _getFileReader() {
    assert(!this.bodyUsed);
    this.bodyUsed = true;

    const reader = new FileReader();
    const promise = new Promise((resolve, reject) => {
      try {
        reader.onerror = _ => reject(new Error('Read error')); // TODO extract error
        reader.onabort = () => reject(new Error('Read aborted.'));
        reader.onload = () => resolve(reader.result);
      } catch (error) {
        reject(error);
      }
    });
    return {reader, promise};
  }
}

// @param {File|Blob} file  HTML File or Blob object to read as string
// @returns {Promise.string}  Resolves to a string containing file contents
export default function fetchFileReadable(fileOrBlob, options) {
  return Promise.resolve(new FileReadableResponse(fileOrBlob, options));
}
