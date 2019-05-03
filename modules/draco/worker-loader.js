// The bundled worker is imported as an inline string
import worker from './dist/draco-loader.worker.js';

module.exports = {
  name: 'DRACO',
  extensions: ['drc'],
  // eslint-disable-next-line
  worker: worker
};
