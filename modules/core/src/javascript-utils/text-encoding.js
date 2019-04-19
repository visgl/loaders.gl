// Node 11 introduces these classes, for lower versions we use these polyfills

/* global TextEncoder,TextDecoder */
if (typeof TextDecoder === 'undefined') {
  require('@loaders.gl/polyfills');
}

module.exports = {TextEncoder, TextDecoder};
