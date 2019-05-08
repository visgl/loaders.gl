"use strict";var module1=module;var isBrowser,global;module1.link('./utils/globals',{isBrowser(v){isBrowser=v},global(v){global=v}},0);var encodeImageNode;module1.link('./images-node/encode-image.node',{encodeImageNode(v){encodeImageNode=v}},1);var parseImageNode;module1.link('./images-node/parse-image.node',{parseImageNode(v){parseImageNode=v}},2);



// Node 11 introduces these classes, for lower versions we use these polyfills

/* global TextEncoder, TextDecoder */
if (typeof TextDecoder === 'undefined' || typeof TextEncoder === 'undefined') {
  const {TextDecoder, TextEncoder} = require('./text-encoding/encoding');
  global.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
}

// These are not official polyfills but used by the @loaders.gl/images module if installed
// TODO - is there an appropriate Image API we could polyfill using an adapter?

if (!isBrowser && typeof global._encodeImageNode === 'undefined') {
  global._encodeImageNode = encodeImageNode;
}

if (!isBrowser && typeof global._parseImageNode === 'undefined') {
  global._parseImageNode = parseImageNode;
}
