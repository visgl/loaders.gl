// Node 11 introduces these classes, for lower versions we use these polyfills

// Determine global variable
/* global self, window, global */
const globals = {
  self: typeof self !== 'undefined' && self,
  window: typeof window !== 'undefined' && window,
  global: typeof global !== 'undefined' && global
};

const global_ = globals.global || globals.self || globals.window;

/* global TextEncoder, TextDecoder */
if (typeof TextDecoder === 'undefined' || typeof TextyEncoder === 'undefined') {
  const {TextDecoder, TextEncoder} = require('./text-encoding/encoding');
  global_.TextDecoder = TextDecoder;
  global_.TextEncoder = TextEncoder;
}
