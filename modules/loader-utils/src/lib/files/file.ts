export type Stat = {
  size: number;
  isDirectory: boolean;
};

export interface ReadableFile {
  /** The underlying file handle (Blob, Node.js file descriptor etc) */
  handle: unknown;
  /** Length of file in bytes, if available */
  size: number;
  /** Read data */
  read(start?: number, end?: number): Promise<ArrayBuffer>;
  /** Read data */
  fetchRange?(offset: number, length: number, signal?: AbortSignal): Promise<Response>;
  /** Get information about file */
  stat?(): Promise<Stat>;
  /** Close the file */
  close(): Promise<void>;
}

export interface WritableFile {
  handle: unknown;
  /** Write to file. The number of bytes written will be returned */
  write: (arrayBuffer: ArrayBuffer, offset?: number, length?: number) => Promise<number>;
  /** Get information about the file */
  stat?(): Promise<Stat>;
  /** Close the file */
  close(): Promise<void>;
}
