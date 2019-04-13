// Node 11 introduces these classes, for lower versions we use these polyfills

/* global TextEncoder,TextDecoder */
if (typeof TextDecoder === 'undefined') {
  module.exports = require('../node/text-encoding/encoding');
} else {
  module.exports = {TextEncoder, TextDecoder};
}
