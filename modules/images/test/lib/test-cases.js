const CONTENT_BASE = '@loaders.gl/images/test/data';
import {isBrowser} from '@loaders.gl/core';

// eslint-disable-next-line quotes
const PNG_BITS = `\
iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2P8z\
/D/PwMDAwMjjAEAQOwF/W1Dp54AAAAASUVORK5CYII=`;

const SVG_BITS = `\
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">\
<path d="M14 26c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6zm24-12H22v14H6V10H2v30h4v-6h36v6h4V22c0-4.42-3.58-8-8-8z"/>\
</svg>`;

export const IMAGE_DATA_URL = `data:image/png;base64,${PNG_BITS}`;
export const SVG_DATA_URL = `data:image/svg+xml;charset=utf-8,${SVG_BITS}`;
export const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';

export const TEST_CASES = [
  {
    title: 'GIF',
    url: `${CONTENT_BASE}/img1-preview.gif`,
    width: 480,
    height: 320
  },
  {
    title: 'Data URL (PNG)',
    url: IMAGE_DATA_URL,
    width: 2,
    height: 2
  },
  {
    title: 'Data URL (SVG)',
    url: SVG_DATA_URL,
    width: 48,
    height: 48,
    skip: !isBrowser
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
    skipUnderNode: true // small bug in `get-pixels` module we could post a patch...
  },
  {
    title: 'JPEG',
    url: `${CONTENT_BASE}/img1-preview.jpeg`,
    width: 480,
    height: 320
  },
  // {
  //   title: 'TIFF',
  //   url: `${CONTENT_BASE}/img1-preview.tiff`,
  //   width: 480,
  //   height: 320
  // },
  {
    title: 'SVG',
    url: `${CONTENT_BASE}/camera.svg`,
    width: 72,
    height: 72,
    skip: !isBrowser
  }
];
