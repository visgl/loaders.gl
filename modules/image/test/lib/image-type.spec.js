import test from 'tape-promise/tape';

// PARSED IMAGE API
import {getDefaultImageType, isImageTypeSupported} from '@loaders.gl/images';

const IMAGE_TYPES = ['auto', 'image', 'imagebitmap', 'data'];

test('Image Category#Parsed Image API imports', t => {
  t.ok(getDefaultImageType, 'getDefaultImageType() is defined');
  t.ok(isImageTypeSupported, 'isImageTypeSupported() is defined');
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
