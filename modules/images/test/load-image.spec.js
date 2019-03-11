import test from 'tape-promise/tape';
import {isBrowser, readFile, loadFile} from '@loaders.gl/core';
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

test('readFile#file (BINARY)', t => {
  if (isBrowser) {
    t.comment('Skip file read in browser');
    t.end();
    return null;
  }

  return readFile(TEST_URL)
    .then(data => {
      t.ok(data instanceof ArrayBuffer, 'readFile loaded local file into ArrayBuffer');
      t.equals(data.byteLength, 168465, 'readFile loaded local file length correctly');
      t.end();
    })
    .catch(error => {
      t.fail(error);
      t.end();
    });
});

test('images#loadImage (NODE)', t => {
  if (isBrowser) {
    t.comment('Skip loadImage file in browser');
    t.end();
    return null;
  }

  return loadImage(TEST_URL)
    .then(result => {
      t.ok(result, 'image loaded successfully');
      t.end();
    })
    .catch(error => {
      t.fail(error);
      t.end();
    });
});

test('images#loadFile(ImageLoader) (NODE)', t => {
  if (isBrowser) {
    t.comment('Skip loadImage file in browser');
    t.end();
    return null;
  }

  return loadFile(TEST_URL, ImageLoader)
    .then(result => {
      t.ok(result, 'image loaded successfully');
      t.end();
    })
    .catch(error => {
      t.fail(error);
      t.end();
    });
});
