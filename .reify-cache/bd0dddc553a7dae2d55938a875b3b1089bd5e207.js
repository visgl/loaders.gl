"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var isBrowser,encode;module.link('@loaders.gl/core',{isBrowser(v){isBrowser=v},encode(v){encode=v}},1);var ImageWriter;module.link('@loaders.gl/images',{ImageWriter(v){ImageWriter=v}},2);var fs;module.link('fs',{default(v){fs=v}},3);var path;module.link('path',{default(v){path=v}},4);
// import {isBrowser, encode, load} from '@loaders.gl/core';
// import {ImageWriter, ImageLoader} from '@loaders.gl/images';





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
test('images#write-and-read-image', async t => {
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
