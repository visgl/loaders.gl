import * as fs from '../node/fs';

/** file reading result */
export type FileReadResult = {
  /** amount of the bytes read */
  bytesRead: number;
  /** the buffer filled with data from file*/
  buffer: Buffer;
};

/** Object handling file info */
export class FileHandle {
  private fileDescriptor: number;
  private stats: fs.BigIntStats;

  private constructor(fileDescriptor: number, stats: fs.BigIntStats) {
    this.fileDescriptor = fileDescriptor;
    this.stats = stats;
  }
  /**
   * Opens a `FileHandle`.
   *
   * @param path path to the file
   * @return Fulfills with a {FileHandle} object.
   */

  static async open(path: string): Promise<FileHandle> {
    const [fd, stats] = await Promise.all([
      new Promise<number>((resolve, reject) => {
        fs.open(path, undefined, undefined, (_err, fd) => (_err ? reject(_err) : resolve(fd)));
      }),
      new Promise<fs.BigIntStats>((resolve, reject) => {
        fs.stat(path, {bigint: true}, (_err, stats) => (_err ? reject(_err) : resolve(stats)));
      })
    ]);
    return new FileHandle(fd, stats);
  }

  /** Close file */
  async close(): Promise<void> {
    return new Promise<void>((resolve) => {
      // @ts-expect-error
      fs.close(this.fileDescriptor, (_err) => resolve());
    });
  }

  /**
   * Reads data from the file and stores that in the given buffer.
   *
   * If the file is not modified concurrently, the end-of-file is reached when the
   * number of bytes read is zero.
   * @param buffer A buffer that will be filled with the file data read.
   * @param offset The location in the buffer at which to start filling.
   * @param length The number of bytes to read.
   * @param position The location where to begin reading data from the file. If `null`, data will be read from the current file position, and the position will be updated. If `position` is an
   * integer, the current file position will remain unchanged.
   * @return Fulfills upon success with a FileReadResult object
   */
  read = (
    buffer: Buffer,
    offset: number,
    length: number,
    position: number | bigint
  ): Promise<FileReadResult> => {
    return new Promise((s) => {
      fs.read(this.fileDescriptor, buffer, offset, length, position, (_err, bytesRead, buffer) =>
        s({bytesRead, buffer})
      );
    });
  };

  get stat(): fs.BigIntStats {
    return this.stats;
  }
}
