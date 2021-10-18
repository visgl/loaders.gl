import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {BasisLoader} from '@loaders.gl/textures';
import encodeBasis from '../../../src/lib/encoders/encode-basis';

const shannonPNG = '@loaders.gl/textures/test/data/shannon.png';
const shannonJPG = '@loaders.gl/textures/test/data/shannon.jpg';

test('EncodeBasis#Should encode png to basis', async (t) => {
  const image = await load(shannonPNG, ImageLoader, {image: {type: 'data'}});
  const basisImageData = await encodeBasis(image, {});
  const transcodedImages = await load(basisImageData, BasisLoader);
  const transcodedImage = transcodedImages[0][0];

  t.ok(basisImageData);
  t.ok(transcodedImage);
  t.equal(image.height, transcodedImage.height);
  t.equal(image.width, transcodedImage.width);

  t.end();
});

test('EncodeBasis#Should encode jpg to basis', async (t) => {
  const image = await load(shannonJPG, ImageLoader, {image: {type: 'data'}});
  const basisImageData = await encodeBasis(image, {});
  const transcodedImages = await load(basisImageData, BasisLoader);
  const transcodedImage = transcodedImages[0][0];

  t.ok(basisImageData);
  t.ok(transcodedImage);
  t.equal(image.height, transcodedImage.height);
  t.equal(image.width, transcodedImage.width);

  t.end();
});
