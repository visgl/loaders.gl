import fs from 'fs';

export function fopen(filePath) {
  return new Promise((resolve, reject) => {
    fs.open(filePath, 'r', (err, fd) => {
      if (err) {
        reject(err);
      } else {
        resolve(fd);
      }
    });
  });
}

export function fstat(filePath) {
  return new Promise<fs.Stats>((resolve, reject) => {
    fs.stat(filePath, (err, stat) => {
      if (err) {
        reject(err);
      } else {
        resolve(stat);
      }
    });
  });
}

export function fread(fd, position, length) {
  const buffer = Buffer.alloc(length);

  return new Promise((resolve, reject) => {
    fs.read(fd, buffer, 0, length, position, (err, bytesRead, buf) => {
      if (err || bytesRead !== length) {
        reject(err || Error('read failed'));
      } else {
        resolve(buf);
      }
    });
  });
}

export function fclose(fd) {
  return new Promise((resolve, reject) => {
    fs.close(fd, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(err);
      }
    });
  });
}

export function oswrite(os, buf): Promise<void> {
  return new Promise((resolve, reject) => {
    os.write(buf, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function osclose(os): Promise<void> {
  return new Promise((resolve, reject) => {
    os.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function osopen(path, opts) {
  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(path, opts);

    outputStream.on('open', function (fd) {
      resolve(outputStream);
    });

    outputStream.on('error', function (err) {
      reject(err);
    });
  });
}
