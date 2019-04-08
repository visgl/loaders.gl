// The bundled worker is imported as an inline string
import worker from '../dist/pcd-loader.worker.js';

export default {
  name: 'PCD',
  extensions: ['pcd'],
  worker
};
