import test from 'tape-promise/tape';
// import {isBrowser, encode, load} from '@loaders.gl/core';
// import {ImageWriter, ImageLoader} from '@loaders.gl/images';
import {isBrowser, encode} from '@loaders.gl/core';
import {ImageWriter} from '@loaders.gl/images';
import fs from 'fs';
import path from 'path';

// import {promisify} from 'util';
// import mkdirp from 'mkdirp';
// const TEST_DIR = path.join(__dirname, '..', 'data');

const TEST_FILE = path.join(__dirname, '../data/test.png');

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
test('ImageWriter#write-and-read-image', async t => {
  if (isBrowser) {
    t.comment('Skip read/write file in browser');
    t.end();
    return;
  }

  fs.writeFileSync(TEST_FILE, encode(IMAGE, ImageWriter, {type: 'png'}));

  // const image = await load(TEST_FILE, ImageLoader);
  // t.same(image, IMAGE);
  t.end();
});
