import test from 'tape-catch';
import {isBrowser} from '@loaders.gl/core';
import {loadImage, encodeImage} from '@loaders.gl/images';
import fs from 'fs';
import path from 'path';

// import {promisify} from 'util';
// import mkdirp from 'mkdirp';
// const TEST_DIR = path.join(__dirname, '..', 'data');

const TEST_DIR = path.join(__dirname);
const TEST_FILE = path.join(TEST_DIR, 'test.png');

const IMAGE = {
  width: 2,
  height: 3,
  data: new Uint8Array([
    255,
    0,
    0,
    255,
    0,
    255,
    255,
    255,
    0,
    0,
    255,
    255,
    255,
    255,
    0,
    255,
    0,
    255,
    0,
    255,
    255,
    0,
    255,
    255
  ])
};

// Test that we can write and read an image, and that result is identical
test('images#write-and-read-image', t => {
  if (isBrowser) {
    t.comment('Skip read/write file in browser');
    t.end();
    return;
  }

  // await promisify(mkdirp)(TEST_DIR);
  const file = fs.createWriteStream(TEST_FILE);

  file.on('close', () => {
    loadImage(TEST_FILE).then(result => {
      t.same(result, IMAGE);
      t.end();
    });
  });

  encodeImage(IMAGE).pipe(file);
});
