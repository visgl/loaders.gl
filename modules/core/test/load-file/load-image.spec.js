import {loadImage, resolvePath} from '@loaders.gl/core';

import test from 'tape-promise/tape';

const CONTENT_BASE = '@loaders.gl/core/../data/';

const TEST_CASES = [
  {
    title: 'Data URL',
    url: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAA
Bytg0kAAAAFElEQVQIW2P8z/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=`,
    width: 2,
    height: 2
  },
  {
    title: 'PNG',
    url: 'images/img1-preview.png',
    width: 480,
    height: 320
  },
  {
    title: 'BMP',
    url: 'images/img1-preview.bmp',
    width: 480,
    height: 320
  },
  {
    title: 'GIF',
    url: 'images/img1-preview.gif',
    width: 480,
    height: 320
  },
  {
    title: 'JPEG',
    url: 'images/img1-preview.jpeg',
    width: 480,
    height: 320
  },
  // {
  //   title: 'TIFF',
  //   url: 'images/img1-preview.tiff',
  //   width: 480,
  //   height: 320
  // },
  {
    title: 'SVG',
    url: 'images/camera.svg',
    width: 72,
    height: 72
  }
];

function testLoadImage({title, url, width, height}) {
  test(title, t => {
    url = url.startsWith('data:') ? url : resolvePath(CONTENT_BASE + url);
    loadImage(url).then(image => {
      t.ok(image, 'loadImage loaded data url');
      t.ok(
        image.naturalWidth === width && image.naturalHeight === height,
        'loaded image has correct content'
      );
    }).catch(t.fail)
    .finally(() => t.end());
  });
}

test('loadImage#imports', t => {
  t.ok(loadImage, 'loadImage defined');
  t.end();
});

test('loadImage#formats', t => {
  if (typeof window === 'undefined') {
    t.comment('loadImage only works under browser');
    t.end();
    return;
  }

  TEST_CASES.forEach(testLoadImage);
  t.end();
});
