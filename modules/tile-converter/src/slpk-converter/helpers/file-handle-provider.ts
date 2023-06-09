import {FileProvider} from 'modules/i3s/src/lib/parsers/parse-zip/file-provider';
import {promises as fsPromises, PathLike} from 'fs';

export class FileHandleProvider implements FileProvider {
  static async from(url: PathLike): Promise<FileHandleProvider> {
    const fileDescriptor = await fsPromises.open(url);
    return new FileHandleProvider(fileDescriptor, (await fileDescriptor.stat()).size);
  }

  private fileDescriptor: fsPromises.FileHandle;

  private size: number;

  private constructor(fileDescriptor: fsPromises.FileHandle, size: number) {
    this.fileDescriptor = fileDescriptor;
    this.size = size;
  }
  async getUint8(offset: number): Promise<number> {
    const val = new Uint8Array(
      (await this.fileDescriptor.read(Buffer.alloc(1), 0, 1, offset)).buffer.buffer
    ).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }
  async getUint16(offset: number): Promise<number> {
    const val = new Uint16Array(
      (await this.fileDescriptor.read(Buffer.alloc(2), 0, 2, offset)).buffer.buffer
    ).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }
  async getUint32(offset: number): Promise<number> {
    const val = new Uint32Array(
      (await this.fileDescriptor.read(Buffer.alloc(4), 0, 4, offset)).buffer.buffer
    ).at(0);
    if (val === undefined) {
      throw new Error('something went wrong');
    }
    return val;
  }
  async slice(startOffsset: number, endOffset: number): Promise<ArrayBuffer> {
    const length = endOffset - startOffsset;
    return (await this.fileDescriptor.read(Buffer.alloc(length), 0, length, startOffsset)).buffer
      .buffer;
  }

  get length(): number {
    return this.size;
  }
}
