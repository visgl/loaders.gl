import {encodeArrowSync} from './lib/encode-arrow';

export default {
  name: 'Apache Arrow',
  extensions: ['arrow', 'feather'],
  mimeTypes: ['application/octet-stream'],
  encodeSync,
  binary: true,
  options: {}
};

function encodeSync(data, options = {}) {
  const arrayBuffer = encodeArrowSync(data, options);
  return arrayBuffer;
}
