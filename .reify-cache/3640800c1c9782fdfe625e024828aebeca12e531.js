"use strict";var module1=module;var isBrowser,global;module1.link('./utils/globals',{isBrowser(v){isBrowser=v},global(v){global=v}},0);var TextDecoder,TextEncoder;module1.link('./text-encoding/encoding',{TextDecoder(v){TextDecoder=v},TextEncoder(v){TextEncoder=v}},1);var fetchNode;module1.link('./fetch-node/fetch.node',{default(v){fetchNode=v}},2);var encodeImageNode;module1.link('./images-node/encode-image.node',{encodeImageNode(v){encodeImageNode=v}},3);var parseImageNode;module1.link('./images-node/parse-image.node',{parseImageNode(v){parseImageNode=v}},4);/* eslint-disable dot-notation */









// POLYFILLS: TextEncoder, TextDecoder
// - Node: v11 introduces these classes, for lower versions we use these polyfills
// - Browser: Edge, IE11 do not have these

if (!('TextEncoder' in global) && TextEncoder) {
  global['TextEncoder'] = TextEncoder;
}
if (!('TextDecoder' in global) && TextDecoder) {
  global['TextDecoder'] = TextDecoder;
}

// POLYFILL: fetch
// - Node: Yes
// - Browser: No. For This polyfill is node only, IE11 etc, install external polyfill

if (!isBrowser && !('fetch' in global) && fetchNode) {
  global['fetch'] = fetchNode;
}

// NODE IMAGE FUNCTIONS:
// These are not official polyfills but used by the @loaders.gl/images module if installed
// TODO - is there an appropriate Image API we could polyfill using an adapter?

if (!isBrowser && !('_encodeImageNode' in global) && encodeImageNode) {
  global['_encodeImageNode'] = encodeImageNode;
}

if (!isBrowser && !('_parseImageNode' in global) && parseImageNode) {
  global['_parseImageNode'] = parseImageNode;
}
