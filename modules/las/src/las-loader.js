// LASER (LAS) FILE FORMAT

import parseLAS from './lib/parse-las';

export default {
  name: 'LAS',
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS,
  mimeType: 'application/octet-stream', // TODO - text version?
  text: true,
  binary: true,
  test: 'LAS',
  parse: parseLAS,
  parseSync: parseLAS
};
