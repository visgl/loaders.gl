// The bundled worker is imported as an inline string
import worker from './dist/las-loader.worker.js';

export default {
  name: 'LAZ',
  extensions: ['las', 'laz'],
  worker
};
