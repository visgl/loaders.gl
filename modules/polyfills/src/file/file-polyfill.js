// Forked from @gozala's web-file under MIT license https://github.com/Gozala/web-file
import {BlobPolyfill} from './blob-polyfill';

/**
 * Forked from @gozala's web-file under MIT license
 * @see https://github.com/Gozala/web-file
 */
export class FilePolyfill extends BlobPolyfill {
  /**
   * @param {BlobPart[]} init
   * @param {string} name - A USVString representing the file name or the path
   * to the file.
   * @param {FilePropertyBag} [options]
   */
  constructor(
    init,
    name = panic(new TypeError('File constructor requires name argument')),
    options = {}
  ) {
    super(init, options);
    // Per File API spec https://w3c.github.io/FileAPI/#file-constructor
    // Every "/" character of file name must be replaced with a ":".
    /** @private */
    this._name = String(name).replace(/\//g, ':');
    /** @private */
    this._lastModified = options.lastModified || Date.now();
  }

  /**
   * The name of the file referenced by the File object.
   * @type {string}
   */
  get name() {
    return this._name;
  }

  /**
   * The path the URL of the File is relative to.
   * @type {string}
   */
  get webkitRelativePath() {
    return '';
  }

  /**
   * Returns the last modified time of the file, in millisecond since the UNIX
   * epoch (January 1st, 1970 at Midnight).
   * @returns {number}
   */
  get lastModified() {
    return this._lastModified;
  }

  get [Symbol.toStringTag]() {
    return 'File';
  }
}

/**
 * @param {Error} error
 * @returns {never}
 */
function panic(error) {
  throw error;
}
