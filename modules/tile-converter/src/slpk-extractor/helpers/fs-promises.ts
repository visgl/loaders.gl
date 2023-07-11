import {read, open, stat, BigIntStats} from 'fs';

export type FileReadResult = {
  bytesRead: number;
  buffer: Buffer;
};

export class FileHandle {
  private fileDescriptor: number;
  private stats: BigIntStats;
  private constructor(fileDescriptor: number, stats: BigIntStats) {
    this.fileDescriptor = fileDescriptor;
    this.stats = stats;
  }

  static open = async (path: string): Promise<FileHandle> => {
    const [fd, stats] = await Promise.all([
      new Promise<number>((s) => {
        open(path, undefined, undefined, (_err, fd) => s(fd));
      }),
      new Promise<BigIntStats>((s) => {
        stat(path, {bigint: true}, (_err, stats) => s(stats));
      })
    ]);
    return new FileHandle(fd, stats);
  };

  read = (
    buffer: Buffer,
    offset: number,
    length: number,
    position: number | bigint
  ): Promise<FileReadResult> => {
    return new Promise((s) => {
      read(this.fileDescriptor, buffer, offset, length, position, (_err, bytesRead, buffer) =>
        s({bytesRead, buffer})
      );
    });
  };

  get stat(): BigIntStats {
    return this.stats;
  }
}
