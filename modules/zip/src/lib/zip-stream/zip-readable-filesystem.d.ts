export type StreamZipOptions = {
  /**
   * By default, entry name is checked for malicious characters, like ../ or c:\123,
   * pass this flag to disable validation error
   * @default false
   */
  skipEntryNameValidation?: boolean

  /**
   * Filesystem read chunk size
   * @default automatic based on file size
   */
  chunkSize?: number
}

declare class ZipEntry {
  /**
   * file name
   */
  name: string

  /**
   * true if it's a directory entry
   */
  isDirectory: boolean

  /**
   * true if it's a file entry, see also isDirectory
   */
  isFile: boolean

  /**
   * file comment
   */
  comment: string

  /**
   * if the file is encrypted
   */
  encrypted: boolean

  /**
   * version made by
   */
  verMade: number

  /**
   * version needed to extract
   */
  version: number

  /**
   * encrypt, decrypt flags
   */
  flags: number

  /**
   * compression method
   */
  method: number

  /**
   * modification time
   */
  time: number

  /**
   * uncompressed file crc-32 value
   */
  crc: number

  /**
   * compressed size
   */
  compressedSize: number

  /**
   * uncompressed size
   */
  size: number

  /**
   * volume number start
   */
  diskStart: number

  /**
   * internal file attributes
   */
  inattr: number

  /**
   * external file attributes
   */
  attr: number

  /**
   * LOC header offset
   */
  offset: number
}

export default class ZipReadableFilesystem {
  constructor(file: string, config?: StreamZipOptions);

  deviceInfo(): Promise<{
    /**
     * archive comment
     */
    comment: string;
  }>;

  // fetch(path: string, options?: object): Promise<Response>;

  readdir(): Promise<string[]>;
  readFile(path: string, options?: object): Promise<Buffer>;

  entries(): Promise<{ [name: string]: ZipEntry }>;
  entry(name: string): Promise<{ [name: string]: ZipEntry }>;
  stream(entry): Promise<NodeJS.ReadableStream>;

  close(): void
}
