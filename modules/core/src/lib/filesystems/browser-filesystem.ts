import type {IFileSystem} from '@loaders.gl/loader-utils';

type BrowserFileSystemOptions = {
  fetch?: typeof fetch;
};

/**
 * FileSystem adapter for a browser FileList.
 * Holds a list of browser 'File' objects.
 */
export default class BrowserFileSystem implements IFileSystem {
  private files: {[filename: string]: File} = {};
  private _fetch: {[key: string]: any};

  /**
   * A FileSystem API wrapper around a list of browser 'File' objects
   * @param files
   * @param options
   */
  constructor(files: FileList | File[], options?: BrowserFileSystemOptions) {
    this._fetch = options?.fetch || fetch;

    for (let i = 0; i < files.length; ++i) {
      const file = files[i];
      this.files[file.name] = file;
    }

    this.fetch = this.fetch.bind(this);
  }

  // implements IFileSystem

  async fetch(path: string, options: object = {}): Promise<Response> {
    if (path.includes('://')) {
      // Falls back to handle https:/http:/data: etc fetches
      // @ts-ignore
      const fallbackFetch = options.fetch || this._fetch;
      return fallbackFetch(path, options);
    }

    // local fetches are served from the list of files
    const file = this.files[path];
    if (file) {
      // return makeResponse()
      const response = new Response(this.files[path]);
      Object.defineProperty(response, 'url', {value: path});
      return response;
    }
    return new Response(path, {status: 400, statusText: 'NOT FOUND'});
  }

  async readdir(dirname?: string): Promise<string[]> {
    const files: string[] = [];
    for (const path in this.files) {
      files.push(path);
    }
    return files;
  }

  stat(filename: string, options?: object): Promise<{size: number}>;
  async stat(path, options) {
    const file = this.files[path];
    if (!file) {
      throw new Error(`No such file: ${path}`);
    }
    return {size: file.size};
  }

  /**
   * Just removes the file from the list
   */
  async unlink(pathname) {
    delete this.files[pathname];
  }

  // implements IRandomAccessFileSystem

  // RANDOM ACCESS
  async open(pathname: string, flags, mode?): Promise<any> {
    return this.files[pathname];
  }

  /**
   * @param options.buffer is the buffer that the data (read from the fd) will be written to.
   * @param options.offset is the offset in the buffer to start writing at.
   * @param options.length is an integer specifying the number of bytes to read.
   * @param options.position is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
   */
  async read(
    fd: number,
    options: {
      buffer: any;
      offset?: number;
      length?: number;
      position?: number;
    }
  ): Promise<any> {
    const {buffer = null, offset = 0, length = buffer.byteLength, position = null} = options;
    const file = fd;
    const arrayBuffer = await readFileSlice(file, position, position + length);
    return arrayBuffer;
  }

  async close(fd: number): Promise<void> {
    // NO OP
  }

  // fstat(fd: number): Promise<object>; // Stat
}

// The trick when reading File objects is to read successive "slices" of the File
// Per spec https://w3c.github.io/FileAPI/, slicing a File should only update the start and end fields
// Actually reading from file should happen in `readAsArrayBuffer` (and as far we can tell it does)
async function readFileSlice(file, start, end) {
  const slice = file.slice(start, end);
  return await new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) => resolve(event.target && event.target.result);
    fileReader.onerror = (error) => reject(error);
    fileReader.readAsArrayBuffer(slice);
  });
}
