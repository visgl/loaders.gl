import type {ReadableFile, WritableFile, Stat} from '@loaders.gl/loader-utils';
import {resolvePath} from '@loaders.gl/loader-utils';
import fs from 'fs';

export class NodeFile implements ReadableFile, WritableFile {
  handle: number;
  size: number;
  bigsize: bigint;
  url: string;

  constructor(path: string, flags: 'r' | 'w' | 'wx' | 'a+', mode?: number) {
    path = resolvePath(path);
    this.handle = fs.openSync(path, flags, mode);
    this.size = 0;
    this.bigsize = 0n;
    this.updateSize();
    this.url = path;
  }

  updateSize() {
    const stats = fs.fstatSync(this.handle, {bigint: true});
    this.size = Number(stats.size);
    this.bigsize = stats.size;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.close(this.handle, (err) => (err ? reject(err) : resolve()));
    });
  }

  async truncate(length: number): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.ftruncate(this.handle, length, (err) => {
        if (err) {
          reject(err);
        } else {
          this.updateSize();
          resolve();
        }
      });
    });
  }

  async append(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.appendFile(this.handle, data, (err) => {
        if (err) {
          reject(err);
        } else {
          this.updateSize();
          resolve();
        }
      });
    });
  }

  async stat(): Promise<Stat> {
    return await new Promise((resolve, reject) =>
      fs.fstat(this.handle, {bigint: true}, (err, info) => {
        const stats: Stat = {
          size: Number(info.size),
          bigsize: info.size,
          isDirectory: info.isDirectory()
        };
        if (err) {
          reject(err);
        } else {
          resolve(stats);
        }
      })
    );
  }

  async read(offset: number | bigint, length: number): Promise<ArrayBuffer> {
    const arrayBuffer = new ArrayBuffer(length);
    let bigOffset = BigInt(offset);

    let totalBytesRead = 0;
    const uint8Array = new Uint8Array(arrayBuffer);

    let position;
    // Read in loop until we get required number of bytes
    while (length > 0) {
      const bytesRead = await readBytes(this.handle, uint8Array, 0, length, bigOffset);

      // Check if end of file reached
      if (bytesRead === 0) {
        break;
      }

      totalBytesRead += bytesRead;
      bigOffset += BigInt(bytesRead);
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
    offset: number | bigint = 0,
    length: number = arrayBuffer.byteLength
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      // TODO - Node.js doesn't offer write with bigint offsets???
      const nOffset = Number(offset);
      const uint8Array = new Uint8Array(arrayBuffer, Number(offset), length);
      fs.write(this.handle, uint8Array, 0, length, nOffset, (err, bytesWritten) =>
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
  position: number | bigint | null
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
