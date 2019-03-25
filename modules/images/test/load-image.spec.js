import test from 'tape-promise/tape';
import {isBrowser, fetchFile, loadFile} from '@loaders.gl/core';
import {loadImage, ImageLoader} from '@loaders.gl/images';
import path from 'path';

// eslint-disable-next-line quotes
const PNG_BITS = `\
iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z\
/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=`;

const DATA_URL = `data:image/png;base64,${PNG_BITS}`;
const TEST_URL = path.join(__dirname, './data/img1-preview.png');

test('images#loadImage', t => {
  loadImage(DATA_URL).then(image => {
    // t.comment(JSON.stringify(image));
    if (isBrowser) {
      t.ok(image, 'image was loaded');
    } else {
      t.deepEquals(image.width, 2, 'image width is correct');
      t.deepEquals(image.height, 2, 'image height is correct');
      t.ok(ArrayBuffer.isView(image.data), 'image data is ArrayBuffer');
      t.equals(image.data.byteLength, 16, 'image data.byteLength is correct');
    }
    t.end();
  });
});

test('fetchFile#arrayBuffer()', async t => {
  if (isBrowser) {
    t.comment('Skip file read in browser');
    t.end();
    return;
  }

  const response = await fetchFile(TEST_URL);
  const data = await response.arrayBuffer();
  t.ok(data instanceof ArrayBuffer, 'fetchFile loaded local file into ArrayBuffer');
  t.equals(data.byteLength, 168465, 'fetchFile loaded local file length correctly');
  t.end();
});

test('images#loadImage (NODE)', async t => {
  if (isBrowser) {
    t.comment('Skip loadImage file in browser');
    t.end();
    return;
  }

  const result = await loadImage(TEST_URL);
  t.ok(result, 'image loaded successfully');
  t.end();
});

test('images#loadFile(ImageLoader) (NODE)', async t => {
  if (isBrowser) {
    t.comment('Skip loadImage file in browser');
    t.end();
    return;
  }

  const result = await loadFile(TEST_URL, ImageLoader);
  t.ok(result, 'image loaded successfully');
  t.end();
});
