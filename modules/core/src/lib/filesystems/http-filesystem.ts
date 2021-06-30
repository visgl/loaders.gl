import type {RandomAccessReadFileSystem, Stat} from './filesystem';

/**
 * Range request FileSystem for Http
 */
export default class HttpFileSystem implements RandomAccessReadFileSystem {
  private _fetch;

  /**
   * @param options
   */
  constructor(options: any = {}) {
    this._fetch = options.fetch || fetch;
  }

  // implements IFileSystem

  // L1: fetch

  async fetch(path: string, options?: any): Promise<Response> {
    // Falls back to handle https:/http:/data: etc fetches
    const fallbackFetch = options.fetch || this._fetch;
    return fallbackFetch(path, options);
  }

  // L2: stat

  async readdir(path: string = '.', options): Promise<string[]> {
    throw new Error('not implemented');
  }

  //
  async stat(path: string, options?: object): Promise<Stat> {
    const response = await fetch(path, {method: 'HEAD'});
    if (!response.ok || response.status !== 200) {
      throw new Error(path);
    }

    // const supportsRanges = response.headers.get('Accept-Ranges') === 'bytes';
    const contentLength = response.headers.get('Content-Length');

    const size = contentLength ? parseInt(contentLength) : 0;
    return {size, isDirectory: () => false};
  }

  // implements IRandomAccessReadFileSystem

  // L3: Random access

  async open(path: string, flags, mode?): Promise<number> {
    return 0;
  }

  async close(fd: number): Promise<void> {
    throw new Error('not implemented');
  }

  async fstat(fd: number): Promise<Stat> {
    throw new Error('not implemented');
  }

  /**
   * Read a range into a buffer
   * @todo - handle position memory
   * @param buffer is the buffer that the data (read from the fd) will be written to.
   * @param offset is the offset in the buffer to start writing at.
   * @param length is an integer specifying the number of bytes to read.
   * @param position is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
   */
  async read(
    fd: any,
    buffer: ArrayBuffer,
    offset: number = 0,
    length: number = buffer.byteLength,
    position: number | null = null
  ): Promise<{bytesRead: number; buffer: ArrayBuffer}> {
    const headers = {
      Range: `bytes=${offset}-${offset + length}`
    };
    const response = await fetch('path', {method: 'GET', headers});
    if (!response.ok) {
      throw new Error('response');
    }

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests#partial_request_responses
    switch (response.status) {
      case 206: // 'Partial Content'
        const buffer = await response.arrayBuffer();
        return {bytesRead: length, buffer};
      case 200: // 'OK'
        // Range requests not supported, we got everything. Pick out the required data
        // const buffer = await response.arrayBuffer();
        // return {bytesRead: length, buffer};
        throw new Error('Range request 200 not implemented');
      case 416: // 'Requested Range Not Satisfiable'
        throw new Error('Range request not satisfiable');
      default:
        throw new Error(String(response.status));
    }
  }
}
