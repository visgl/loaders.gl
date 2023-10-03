import {ReadableFile, WritableFile, Stat} from '@loaders.gl/loader-utils';
import fs from 'fs';

export class NodeFile implements ReadableFile, WritableFile {
  handle: number;
  size: number;

  constructor(path, flags: 'a' | 'w' | 'wx', mode?: number) {
    this.handle = fs.openSync(path, flags, mode);
    this.size = fs.fstatSync(this.handle).size;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.close(this.handle, (err) => (err ? reject(err) : resolve()));
    });
  }

  async stat(): Promise<Stat> {
    return await new Promise((resolve, reject) =>
      fs.fstat(this.handle, (err, info) =>
        err ? reject(err) : resolve({size: info.size, isDirectory: info.isDirectory()})
      )
    );
  }

  async read(offset: number, length: number): Promise<ArrayBuffer> {
    const arrayBuffer = new ArrayBuffer(length);

    let totalBytesRead = 0;
    const uint8Array = new Uint8Array(arrayBuffer);

    let position;
    // Read in loop until we get required number of bytes
    while (length > 0) {
      const bytesRead = await readBytes(this.handle, uint8Array, 0, length, offset);

      // Check if end of file reached
      if (bytesRead === 0) {
        break;
      }

      totalBytesRead += bytesRead;
      offset += bytesRead;
      length -= bytesRead;

      // Advance position unless we are using built-in position advancement
      if (position !== undefined) {
        position += bytesRead;
      }
    }
    return totalBytesRead < length ? arrayBuffer.slice(0, totalBytesRead) : arrayBuffer;
  }

  async write(
    arrayBuffer: ArrayBuffer,
    offset: number = 0,
    length: number = arrayBuffer.byteLength
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(arrayBuffer, offset, length);
      fs.write(this.handle, uint8Array, (err, bytesWritten) =>
        err ? reject(err) : resolve(bytesWritten)
      );
    });
  }
}

async function readBytes(
  fd: number,
  uint8Array: Uint8Array,
  offset: number,
  length: number,
  position: number | null
): Promise<number> {
  return await new Promise<number>((resolve, reject) =>
    fs.read(fd, uint8Array, offset, length, position, (err, bytesRead) =>
      err ? reject(err) : resolve(bytesRead)
    )
  );
}

// TODO - implement streaming write
/*
export interface WriteStreamOptions {
  flags?: string;
  encoding?: 'utf8';
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  start?: number;
}

export class NodeStreamWritableFile implements WritableFile {
  outputStream: fs.WriteStream | Writable;

  constructor(pathOrStream: string | Writable, options?: WriteStreamOptions) {
    this.outputStream =
      typeof pathOrStream === 'string' ? fs.createWriteStream(pathOrStream, options) : pathOrStream;
  }

  async write(buffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(buffer);
      this.outputStream.write(uint8Array, (err) => (err ? reject(err) : resolve()));
    });
  }

  async close(): Promise<void> {
    if (this.outputStream instanceof fs.WriteStream) {
      return new Promise((resolve, reject) => {
        const stream = this.outputStream as fs.WriteStream;
        stream.close((err) => (err ? reject(err) : resolve()));
      });
    }
  }
}
*/
