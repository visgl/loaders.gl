import fs from 'fs';
import util from 'util';

export default class FsRead {
  constructor(fd, buffer, offset, length, position) {
    this.fd = fd;
    this.buffer = buffer;
    this.offset = offset;
    this.length = length;
    this.position = position;

    this.bytesRead = 0;
  }

  async read() {
    const read = util.promisify(fs.read);

    debugger
    const {bytesRead} = await read(
      this.fd,
      this.buffer,
      this.offset + this.bytesRead,
      this.length - this.bytesRead,
      this.position + this.bytesRead
    );

    if (typeof bytesRead === 'number') {
      this.bytesRead += bytesRead;
    }
    if (!bytesRead || this.bytesRead === this.length) {
      return this.bytesRead;
    }
    return await this.read();
  }

  /*
  readSync() {
    if (debug) {
      console.log('read', this.position, this.bytesRead, this.length, this.offset);
    }
    const bytesRead = fs.readSync(this.fd, this.buffer, this.offset + this.bytesRead,
      this.length - this.bytesRead, this.position + this.bytesRead);

    if (typeof bytesRead === 'number') {
      this.bytesRead += bytesRead;
    }
    if (!bytesRead || this.bytesRead === this.length) {
      return this.bytesRead;
    }
    return this.readSync();
  }
  */
}
