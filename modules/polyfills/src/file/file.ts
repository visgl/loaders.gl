// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

// Forked from @gozala's web-file under MIT license https://github.com/Gozala/web-file

/**
 * Forked from @gozala's web-file under MIT license
 * @see https://github.com/Gozala/web-file
 */
// @ts-ignore
export class FilePolyfill extends globalThis.Blob {
  // implements File {
  // public API
  /** The name of the file referenced by the File object. */
  name: string = '';
  /** The path the URL of the File is relative to. */
  webkitRelativePath: string = '';

  /**
   * Returns the last modified time of the file, in millisecond since the UNIX
   * epoch (January 1st, 1970 at Midnight).
   */
  lastModified: number;

  /**
   * @param init
   * @param name - A USVString representing the file name or the path
   * to the file.
   * @param [options]
   */
  constructor(init: BlobPart[], name: string, options: FilePropertyBag = {}) {
    super(init, options);
    // Per File API spec https://w3c.github.io/FileAPI/#file-constructor
    // Every "/" character of file name must be replaced with a ":".
    /** @private */
    this.name = String(name).replace(/\//g, ':');
    /** @private */
    this.lastModified = options?.lastModified || Date.now();
  }

  get [Symbol.toStringTag]() {
    return 'File';
  }
}
