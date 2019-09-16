// The bundled worker is imported as an inline string
import worker from '../dist/arrow-loader.worker.js';

export default {
  name: 'Apache Arrow',
  extensions: ['arrow'],
  mimeType: 'application/octet-stream',
  category: 'table',
  worker
};
