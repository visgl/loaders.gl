/* global ImageBitmap */
import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';

// PARSED IMAGE API
import {
  isImageTypeSupported,
  isImage,
  getImageType,
  getImageSize,
  getImageData,
  getImageDataAsync
} from '@loaders.gl/images';

const IMAGE_TYPES = ['auto', 'image', 'imagebitmap', 'data'];

const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';

let imagesPromise = null;

async function loadImages() {
  imagesPromise =
    imagesPromise ||
    Promise.all(
      IMAGE_TYPES.filter(isImageTypeSupported).map(type =>
        load(IMAGE_URL, ImageLoader, {image: {type}})
      )
    );
  return await imagesPromise;
}

test('Image Category#Parsed Image API imports', t => {
  t.ok(isImageTypeSupported, 'isImageTypeSupported() is defined');
  t.ok(isImage, 'isImage() is defined');
  t.ok(getImageType, 'getImageType() is defined');
  t.ok(getImageSize, 'getImageSize() is defined');
  t.ok(getImageData, 'getImageData() is defined');
  t.end();
});

test('Image Category#isImageTypeSupported', async t => {
  for (const type of IMAGE_TYPES) {
    const supported = isImageTypeSupported(type);
    t.equals(
      typeof supported,
      'boolean',
      `isImageTypeSupported(${type}) returns boolean (${supported})`
    );
  }
  t.throws(() => isImageTypeSupported('unknown type'));
  t.end();
});

test('Image Category#isImage', async t => {
  const IMAGES = await loadImages();
  for (const image of IMAGES) {
    t.equals(isImage(image), true, 'isImage recognizes image');
  }
  // @ts-ignore
  t.equals(isImage('not an image'), false, 'isImage rejects non-image');
  t.end();
});

test('Image Category#getImageType', async t => {
  const IMAGES = await loadImages();
  for (const image of IMAGES) {
    t.ok(IMAGE_TYPES.includes(getImageType(image)), 'returns a valid image type');
  }
  // @ts-ignore
  t.throws(() => getImageType('not an image'));
  t.end();
});

test('Image Category#getImageSize', async t => {
  const IMAGES = await loadImages();
  for (const image of IMAGES) {
    t.equals(typeof getImageSize(image), 'object', 'returns size object');
  }
  // @ts-ignore
  t.throws(() => getImageSize('unknown type'));
  t.end();
});

test('Image Category#getImageData', async t => {
  const IMAGES = await loadImages();
  for (const image of IMAGES) {
    const imageData = getImageData(image);
    t.equals(typeof imageData, 'object', 'returns data');
    // @ts-ignore
    t.notOk(imageData.worker, 'processed on main-thread');
  }
  // @ts-ignore
  t.throws(() => getImageData('not an image'));
  t.end();
});

test('Image Category#getImageDataAsync', async t => {
  const IMAGES = await loadImages();
  for (const image of IMAGES) {
    const imageData = getImageData(image);
    const imageData2 = await getImageDataAsync(image);
    t.deepEquals(imageData.data, imageData2.data, 'returns correct data');
    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
      // @ts-ignore
      t.ok(imageData2.worker, 'processed on worker');
    }
  }
  t.end();
});
