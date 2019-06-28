// LASER (LAS) FILE FORMAT

import parseLAS from './parse-las';

export default {
  name: 'LAS',
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS,
  text: true,
  binary: true,
  test: 'LAS',
  parseSync: parseLAS
};
