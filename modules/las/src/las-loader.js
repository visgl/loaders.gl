// LASER (LAS) FILE FORMAT

import parseLAS from './parse-las';

export default {
  name: 'LAZ',
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS
  parseSync: parseLAS
};
