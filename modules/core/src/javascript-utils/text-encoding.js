/* global TextEncoder,TextDecoder */
if (typeof TextDecoder === 'undefined' || typeof TextEncoder === 'undefined') {
  module.exports = {};
} else {
  module.exports = {TextEncoder, TextDecoder};
}
