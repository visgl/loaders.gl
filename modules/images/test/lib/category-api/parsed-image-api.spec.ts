import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {
  ImageLoader,
  ImageBitmapLoader,
  ImageType,
  // PARSED IMAGE API
  getDefaultImageType,
  isImageTypeSupported,
  isImage,
  getImageType,
  getImageSize,
  getImageData
} from '@loaders.gl/images';
type ImageT = 'auto' | 'image' | 'imagebitmap' | 'data';
const IMAGE_TYPES: ImageT[] = ['auto', 'image', 'imagebitmap', 'data'];
const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';
let imagesPromise: Promise<ImageType[]> | null = null;
async function loadImages(): Promise<ImageType[]> {
  imagesPromise =
    imagesPromise ||
    Promise.all([
      load(IMAGE_URL, ImageBitmapLoader),
      ...IMAGE_TYPES.filter(type => type !== 'imagebitmap' && isImageTypeSupported(type)).map(
        type => load(IMAGE_URL, ImageLoader, {image: {type}})
      )
    ]);
  return await imagesPromise;
}
test('Image Category#Parsed Image API imports', () => {
  expect(getDefaultImageType, 'getDefaultImageType() is defined').toBeTruthy();
  expect(isImageTypeSupported, 'isImageTypeSupported() is defined').toBeTruthy();
  expect(isImage, 'isImage() is defined').toBeTruthy();
  expect(getImageType, 'getImageType() is defined').toBeTruthy();
  expect(getImageSize, 'getImageSize() is defined').toBeTruthy();
  expect(getImageData, 'getImageData() is defined').toBeTruthy();
});
test('Image Category#getDefaultImageType', async () => {
  const imageType = getDefaultImageType();
  expect(IMAGE_TYPES.includes(imageType), 'Returns an expected image type').toBeTruthy();
  if (globalThis.loaders?.parseImageNode) {
    expect(imageType, 'Node polyfills prefer imagebitmap').toBe('imagebitmap');
  }
});
test('Image Category#isImageTypeSupported', async () => {
  for (const type of IMAGE_TYPES) {
    const supported = isImageTypeSupported(type);
    expect(typeof supported, `isImageTypeSupported(${type}) returns boolean (${supported})`).toBe(
      'boolean'
    );
  }
  expect(() => isImageTypeSupported('unknown type')).toThrow();
});
test('Image Category#isImage', async () => {
  const IMAGES = await loadImages();
  for (const image of IMAGES) {
    expect(isImage(image), 'isImage recognizes image').toBe(true);
  }
  // @ts-ignore
  expect(isImage('not an image'), 'isImage rejects non-image').toBe(false);
});
test('Image Category#getImageType', async () => {
  const IMAGES = await loadImages();
  const imageTypes = IMAGES.map(getImageType);
  expect(imageTypes.includes('imagebitmap'), 'returns bitmap type').toBeTruthy();
  expect(imageTypes.includes('data'), 'returns data type').toBeTruthy();
  if (isImageTypeSupported('image')) {
    expect(imageTypes.includes('image'), 'returns image type when supported').toBeTruthy();
  }
  // @ts-ignore
  expect(() => getImageType('not an image')).toThrow();
});
test('Image Category#getImageSize', async () => {
  const IMAGES = await loadImages();
  for (const image of IMAGES) {
    expect(typeof getImageSize(image), 'returns size object').toBe('object');
  }
  // @ts-ignore
  expect(() => getImageSize('unknown type')).toThrow();
});
test('Image Category#getImageData', async () => {
  const IMAGES = await loadImages();
  for (const image of IMAGES) {
    expect(typeof getImageData(image), 'returns data').toBe('object');
  }
  // @ts-ignore
  expect(() => getImageData('not an image')).toThrow();
});
