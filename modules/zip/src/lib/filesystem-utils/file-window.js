/* global Buffer */
import NodeFileSystem from '../filesystems/node-filesystem';

export default class FileWindow {
  constructor(fd, fs) {
    this.position = 0;
    this.buffer = Buffer.alloc(0);

    this.fd = fd;
    this.fs = new NodeFileSystem();
  }

  async read(pos, length, callback) {
    if (callback) {
      throw new Error('FileWindow::Callback');
    }

    if (this.buffer.length < length) {
      this.buffer = Buffer.alloc(length);
    }
    this.position = pos;
    debugger
    return await this.fs.read(this.fd, {
      buffer: this.buffer,
      offset: 0,
      length,
      position: this.position
    });
  }

  async expandLeft(length) {
    this.buffer = Buffer.concat([Buffer.alloc(length), this.buffer]);
    this.position -= length;
    if (this.position < 0) {
      this.position = 0;
    }
    debugger
    return await this.fs.read(this.fd, {
      buffer: this.buffer,
      offset: 0,
      length,
      position: this.position
    });
  }

  async expandRight(length) {
    const offset = this.buffer.length;
    this.buffer = Buffer.concat([this.buffer, Buffer.alloc(length)]);
    debugger
    return await this.fs.read(this.fd, {
      buffer: this.buffer,
      offset,
      length,
      position: this.position + offset
    });
  }

  async moveRight(length, shift) {
    if (shift) {
      this.buffer.copy(this.buffer, 0, shift);
    } else {
      shift = 0;
    }
    this.position += shift;
    debugger
    return await this.fs.read(this.fd, {
      buffer: this.buffer,
      offset: this.buffer.length - shift,
      length: shift,
      position: this.position + this.buffer.length - shift
    });
  }
}
