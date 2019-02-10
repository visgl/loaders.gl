// The bundled worker is imported as an inline string
import worker from '../dist/draco-loader.worker.js';

export default {
  name: 'DRACO',
  extension: 'drc',
  worker
};
