import test from 'tape-promise/tape';
import {load, encode} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {BasisLoader, KTX2TextureWriter} from '@loaders.gl/textures';

const shannonPNG = '@loaders.gl/textures/test/data/shannon.png';
const shannonJPG = '@loaders.gl/textures/test/data/shannon.jpg';

test('EncodeKTX2#Should encode png to KTX2', async (t) => {
  const image = await load(shannonPNG, ImageLoader, {image: {type: 'data'}});
  const encodedData = await encode(image, KTX2TextureWriter);
  const transcodedImages = await load(encodedData, BasisLoader);
  const transcodedImage = transcodedImages[0];

  t.ok(encodedData);
  t.ok(transcodedImage);
  t.equal(image.height, transcodedImage.height);
  t.equal(image.width, transcodedImage.width);

  t.end();
});

test('EncodeKTX2#Should encode jpg to KTX2', async (t) => {
  const image = await load(shannonJPG, ImageLoader, {image: {type: 'data'}});
  const encodedData = await encode(image, KTX2TextureWriter);
  const transcodedImages = await load(encodedData, BasisLoader);
  const transcodedImage = transcodedImages[0];

  t.ok(encodedData);
  t.ok(transcodedImage);
  t.equal(image.height, transcodedImage.height);
  t.equal(image.width, transcodedImage.width);

  t.end();
});
