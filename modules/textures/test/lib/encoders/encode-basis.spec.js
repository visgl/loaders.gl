import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import encodeBasis from '@loaders.gl/textures/lib/encoders/encode-basis';

const shannonPNG = '@loaders.gl/textures/test/data/shannon.png';
const shannonJPG = '@loaders.gl/textures/test/data/shannon.jpg';

test('EncodeBasis#Should encode png to basis', async (t) => {
  const image = await load(shannonPNG, ImageLoader);
  const basisImageData = await encodeBasis(image, {});

  t.ok(basisImageData);
  t.end();
});

test('EncodeBasis#Should encode jpg to basis', async (t) => {
  const image = await load(shannonJPG, ImageLoader);
  const basisImageData = await encodeBasis(image, {});

  t.ok(basisImageData);
  t.end();
});
