/* global TextEncoder,TextDecoder */
if (typeof TextDecoder === 'undefined') {
  module.exports = {};
} else {
  module.exports = {TextEncoder, TextDecoder};
}

