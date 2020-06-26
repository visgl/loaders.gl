/* global fetch, Response, FileReader */
/** @typedef {import('./filesystem').IFileSystem} IFileSystem */

/** @implements {IFileSystem} */
export default class BrowserFileSystem {
  constructor(files, options = {}) {
    this._fetch = options.fetch || fetch;
    this.files = {};
    this.lowerCaseFiles = {};
    this.usedFiles = {};

    for (let i = 0; i < files.length; ++i) {
      const file = files[i];
      this.files[file.name] = file;
      this.lowerCaseFiles[file.name.toLowerCase()] = file;
      this.usedFiles[file.name] = false;
    }

    this.fetch = this.fetch.bind(this);
  }

  // FETCH

  async fetch(path, options = {}) {
    if (path.includes('://')) {
      // Falls back to handle https:/http:/data: etc fetches
      const fallbackFetch = options.fetch || this._fetch;
      return fallbackFetch(path, options);
    }

    // local fetches are served from the list of files
    const file = this._getFile(path, true);
    if (file) {
      // TODO - prepare headers
      // return makeResponse()
      return new Response(file);
    }
    return new Response(path, {status: 400, statusText: 'NOT FOUND'});
  }

  // STAT

  async readdir() {
    const files = [];
    for (const path in this.files) {
      files.push(path);
    }
    return files;
  }

  async stat(path, options) {
    const file = this._getFile(path, false);
    if (!file) {
      throw new Error(`No such file: ${path}`);
    }
    return {size: file.size};
  }

  // RANDOM ACCESS

  async unlink(path) {
    // Just removes the file from the lists
    delete this.files[path];
    delete this.lowerCaseFiles[path]
    this.usedFiles[path] = true;
  }

  // RANDOM ACCESS
  async open(path) {
    return this._getFile(path, true);
  }

  // buffer is the buffer that the data (read from the fd) will be written to.
  // offset is the offset in the buffer to start writing at.
  // length is an integer specifying the number of bytes to read.
  // position is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
  async read(fd, {buffer = null, offset = 0, length = buffer.byteLength, position = null}) {
    const file = fd;
    const arrayBuffer = await readFileSlice(file, position, position + length);
    return arrayBuffer;
  }

  async close(fd) {
    // NO OP
  }

  // PRIVATE

  // Supports case independent paths, and file usage tracking
  _getFile(path, used) {
    // Prefer case match, but fall back to case indepent.
    const file = this.files[path] || this.lowerCaseFiles[path];
    if (file && used) {
      this.usedFiles[path] = true;
    }
    return file;
  }
}

// The trick when reading File objects is to read successive "slices" of the File
// Per spec https://w3c.github.io/FileAPI/, slicing a File should only update the start and end fields
// Actually reading from file should happen in `readAsArrayBuffer` (and as far we can tell it does)
async function readFileSlice(file, start, end) {
  const slice = file.slice(start, end);
  return await new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onloadend = event => resolve(event.target.result);
    fileReader.onerror = error => reject(error);
    fileReader.readAsArrayBuffer(slice);
  });
}
