// The bundled worker is imported as an inline string
import worker from '../dist/ply-loader.worker.js';

export default {
  name: 'PLY',
  extension: 'ply',
  worker
};
