import test from 'tape-promise/tape';
import {encode, parse} from '@loaders.gl/core';
import {ImageWriter, ImageLoader, getBinaryImageMetadata} from '@loaders.gl/images';

const IMAGE = {
  width: 2,
  height: 3,
  // prettier-ignore
  data: new Uint8Array([
    255, 0, 0, 255, 0, 255, 255, 255, 0, 0, 255, 255, 255, 255, 0, 255, 0, 255, 0, 255, 255, 0, 255, 255
  ])
};

// Test that we can write and read an image, and that result is identical
test('ImageWriter#write-and-read-image', async (t) => {
  let arrayBuffer = await encode(IMAGE, ImageWriter, {
    image: {mimeType: 'image/jpeg', jpegQuality: 90}
  });
  let metadata = getBinaryImageMetadata(arrayBuffer);
  t.ok(metadata);
  if (metadata) {
    t.equal(metadata.width, IMAGE.width, 'encoded image width is correct');
    t.equal(metadata.height, IMAGE.height, 'encoded image height is correct');
    t.equal(metadata.mimeType, 'image/jpeg', 'encoded image mimeType is correct');
  }

  let image = await parse(arrayBuffer, ImageLoader, {image: {type: 'data'}});
  t.deepEqual(image.width, IMAGE.width, 'encoded and parsed image widths are same');
  t.deepEqual(image.height, IMAGE.height, 'encoded and parsed image heights are same');
  // NOTE - encoded and decoded data are expected to be equal due to lossy jpeg compression
  // TODO - even, so they seems a bit too different, may want to do additional checks
  // t.deepEqual(image.data, IMAGE.data, 'encoded and parsed image data are same');

  arrayBuffer = await encode(IMAGE, ImageWriter, {image: {mimeType: 'image/png'}});
  metadata = getBinaryImageMetadata(arrayBuffer);
  t.ok(metadata);
  if (metadata) {
    t.equal(metadata.width, IMAGE.width, 'encoded image width is correct');
    t.equal(metadata.height, IMAGE.height, 'encoded image height is correct');
    t.equal(metadata.mimeType, 'image/png', 'encoded image mimeType is correct');
  }

  image = await parse(arrayBuffer, ImageLoader, {image: {type: 'data'}});
  t.deepEqual(image.width, IMAGE.width, 'encoded and parsed image widths are same');
  t.deepEqual(image.height, IMAGE.height, 'encoded and parsed image heightsare same');
  t.deepEqual(image.data, IMAGE.data, 'encoded and parsed image data are same');

  t.end();
});
