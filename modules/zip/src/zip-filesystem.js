/* global Response */
import JSZip from 'jszip';

export default class ZipFileSystem {
  constructor(data, options) {
    this.options = options;
    this.zipArchive = new JSZip();
    this.zipPromise = this.zipArchive.loadAsync(data, options);
    this.fetch = this.fetch.bind(this);
  }

  // Special
  async readAllFiles(options) {
    try {
      const zip = await this.zipPromise;

      const promises = [];
      const fileMap = {};

      // start to load each file in this zip
      zip.forEach((relativePath, zipEntry) => {
        const subFilename = zipEntry.name;

        const promise = this.fetch(subFilename, options).then(arrayBufferOrError => {
          fileMap[relativePath] = arrayBufferOrError;
        });

        // Ensure Promise.all doesn't ignore rejected promises.
        promises.push(promise);
      });

      await Promise.all(promises);
      return fileMap;
    } catch (error) {
      throw new Error(`Unable to read zip archive: ${error}`);
    }
  }

  // IFileSystem

  async readdir() {
    const zip = await this.zipPromise;
    const files = [];
    zip.forEach((relativePath, zipEntry) => files.push(relativePath));
    return files;
  }

  async stat(filename, options) {
    return {size: 0};
  }

  async fetch(subFilename, options) {
    // jszip supports both arraybuffer and text, the main loaders.gl types
    // https://stuk.github.io/jszip/documentation/api_zipobject/async.html
    try {
      const arrayBuffer = await this.zipArchive.file(subFilename).async('arraybuffer');
      return new Response(arrayBuffer);
    } catch (error) {
      throw new Error(`Unable to fetch ${subFilename} from zip archive: ${error}`);
    }
  }

  // IWritableFileSystem

  async mkdir(filename, options) {
    return this.zipArchive.folder(filename);
  }

  async writeFile(subFilename, data, options) {
    // const arrayBuffer = await this.zipArchive.file(subFilename).async('arraybuffer');
  }

  async unlink(path) {
    this.zipArchive.remove(path);
  }
}
