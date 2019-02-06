// The bundled worker is imported as an inline string
import worker from '../dist/arrow-loader.worker.js';

export default {
  name: 'Apache Arrow',
  extension: 'arrow',
  worker
};
