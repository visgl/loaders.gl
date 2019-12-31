import {isBrowser} from '@loaders.gl/core';

const CONTENT_BASE = '@loaders.gl/images/test/data';

// eslint-disable-next-line quotes
const PNG_BITS = `\
iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z\
/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=`;

export const IMAGE_DATA_URL = `data:image/png;base64,${PNG_BITS}`;
export const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';

export const TEST_CASES = [
  {
    title: 'GIF',
    url: `${CONTENT_BASE}/img1-preview.gif`,
    width: 480,
    height: 320
  },
  {
    title: 'Data URL',
    url: IMAGE_DATA_URL,
    width: 2,
    height: 2,
    worker: false
  },
  {
    title: 'PNG',
    url: `${CONTENT_BASE}/img1-preview.png`,
    width: 480,
    height: 320
  },
  {
    title: 'BMP',
    url: `${CONTENT_BASE}/img1-preview.bmp`,
    width: 480,
    height: 320,
    skip: !isBrowser // small bug in `get-pixels` module for BMP (we could post a patch...)
  },
  {
    title: 'JPEG',
    url: `${CONTENT_BASE}/img1-preview.jpeg`,
    width: 480,
    height: 320
  }
  /*
  ,
  {
    title: 'TIFF',
    url: `${CONTENT_BASE}/img1-preview.tiff`,
    width: 480,
    height: 320
  },
  {
    title: 'SVG',
    url: `${CONTENT_BASE}/camera.svg`,
    width: 72,
    height: 72,
    worker: false
  }
  */
];
