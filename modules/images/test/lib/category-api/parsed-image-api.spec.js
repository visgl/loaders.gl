import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';

// PARSED IMAGE API
import {
  getDefaultImageType,
  isImageTypeSupported,
  isImage,
  getImageType,
  getImageSize,
  getImageData
} from '@loaders.gl/images';

const IMAGE_TYPES = ['auto', 'image', 'imagebitmap', 'data'];

const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';

const IMAGES_PROMISE = Promise.all(
  IMAGE_TYPES.filter(isImageTypeSupported).map(type =>
    load(IMAGE_URL, ImageLoader, {image: {type}})
  )
);

test('Image Category#Parsed Image API imports', t => {
  t.ok(getDefaultImageType, 'getDefaultImageType() is defined');
  t.ok(isImageTypeSupported, 'isImageTypeSupported() is defined');
  t.ok(isImage, 'isImage() is defined');
  t.ok(getImageType, 'getImageType() is defined');
  t.ok(getImageSize, 'getImageSize() is defined');
  t.ok(getImageData, 'getImageData() is defined');
  t.end();
});

test('Image Category#getDefaultImageType', async t => {
  const imageType = getDefaultImageType();
  t.ok(IMAGE_TYPES.includes(imageType), 'Returns an expected image type');
  t.end();
});

test('Image Category#isImageTypeSupported', async t => {
  for (const type of IMAGE_TYPES) {
    t.equals(typeof isImageTypeSupported(type), 'boolean', 'returns boolean');
  }
  t.throws(() => isImageTypeSupported('unknown type'));
  t.end();
});

test('Image Category#isImage', async t => {
  const IMAGES = await IMAGES_PROMISE;
  for (const image of IMAGES) {
    t.equals(isImage(image), true, 'isImage recognizes image');
  }
  t.equals(isImage('not an image'), false, 'isImage rejects non-image');
  t.end();
});

test('Image Category#getImageType', async t => {
  const IMAGES = await IMAGES_PROMISE;
  for (const image of IMAGES) {
    t.ok(IMAGE_TYPES.includes(getImageType(image)), 'returns a valid image type');
  }
  t.throws(() => getImageType('not an image'));
  t.end();
});

test('Image Category#getImageSize', async t => {
  const IMAGES = await IMAGES_PROMISE;
  for (const image of IMAGES) {
    t.equals(typeof getImageSize(image), 'object', 'returns size object');
  }
  t.throws(() => getImageSize('unknown type'));
  t.end();
});

test('Image Category#getImageData', async t => {
  const IMAGES = await IMAGES_PROMISE;
  for (const image of IMAGES) {
    t.equals(typeof getImageData(image), 'object', 'returns data');
  }
  t.throws(() => getImageData('not an image'));
  t.end();
});
