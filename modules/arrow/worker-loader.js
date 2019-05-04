// The bundled worker is imported as an inline string
import worker from './dist/arrow-loader.worker.js';

module.exports = {
  name: 'Apache Arrow',
  extensions: ['arrow'],
  worker
};
