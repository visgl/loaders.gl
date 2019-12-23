import test from 'tape-promise/tape';
import {loadImage, loadImageArray, loadImageCube, isImage} from '@loaders.gl/images';

const LUT_URL = '@loaders.gl/images/test/data/ibl/brdfLUT.png';
const PAPERMILL_URL = '@loaders.gl/images/test/data/ibl/papermill';

test('loadImage#mipLevels=0', async t => {
  const image = await loadImage(LUT_URL);
  t.ok(isImage(image));
  t.end();
});

test('loadImage#mipLevels=auto', async t => {
  const mipmappedImage = await loadImage(({lod}) => `specular/specular_back_${lod}.jpg`, {
    baseUrl: PAPERMILL_URL,
    image: {
      mipLevels: 'auto'
    }
  });
  t.ok(mipmappedImage.every(isImage));
  t.end();
});

test('loadImageArray#mipLevels=0', async t => {
  const images = await loadImageArray(10, ({index}) => `specular/specular_back_${index}.jpg`, {
    baseUrl: PAPERMILL_URL
  });
  t.equal(images.length, 10, 'loadArray loaded 10 images');
  t.ok(images.every(isImage));
  t.end();
});

test('loadImageArray#mipLevels=auto', async t => {
  const images = await loadImageArray(1, ({index, lod}) => `specular/specular_back_${lod}.jpg`, {
    baseUrl: PAPERMILL_URL,
    image: {
      mipLevels: 'auto'
    }
  });
  t.equal(images.length, 1, 'loadArray loaded 1 image');
  images.every(imageMips => {
    t.equal(imageMips.length, 10, `array of mip images has correct length`);
    t.ok(imageMips.every(isImage), `entry is a valid array of mip images`);
  });
  t.end();
});

test('loadImageCube#mipLevels=0', async t => {
  const imageCube = await loadImageCube(({direction}) => `diffuse/diffuse_${direction}_0.jpg`, {
    baseUrl: PAPERMILL_URL
  });
  t.equal(Object.keys(imageCube).length, 6, 'image cube has 6 images');
  for (const face in imageCube) {
    const image = imageCube[face];
    t.ok(isImage(image), `face ${face} is a valid image`);
  }
  t.end();
});

test('loadImageCube#mipLevels=auto', async t => {
  const imageCube = await loadImageCube(
    ({direction, lod}) => `specular/specular_${direction}_${lod}.jpg`,
    {
      baseUrl: PAPERMILL_URL,
      image: {
        mipLevels: 'auto'
      }
    }
  );
  t.equal(Object.keys(imageCube).length, 6, 'image cube has 6 images');
  for (const face in imageCube) {
    const imageMips = imageCube[face];
    t.equal(imageMips.length, 10, `array of mip images has correct length`);
    // t.ok(imageMips.every(isImage) `face ${face} is a valid array of mip images`);
  }
  t.end();
});
