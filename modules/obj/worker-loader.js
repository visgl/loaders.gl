// The bundled worker is imported as an inline string
import worker from './dist/obj-loader.worker.js';

export default {
  name: 'OBJ',
  extensions: ['obj'],
  worker
};
