"use strict";var global,isBrowser;module.link('./utils/globals',{global(v){global=v},isBrowser(v){isBrowser=v}},0);var TextDecoder,TextEncoder;module.link('./text-encoding/encoding',{TextDecoder(v){TextDecoder=v},TextEncoder(v){TextEncoder=v}},1);var fetchNode;module.link('./fetch-node/fetch.node',{default(v){fetchNode=v}},2);/* eslint-disable dot-notation */




// POLYFILLS: TextEncoder, TextDecoder
// - Node: v11 introduces these classes, for lower versions we use these polyfills
// - Browser: Edge, IE11 do not have these

if (typeof global['TextEncoder'] === 'undefined' || typeof global['TextDecoder'] === 'undefined') {
  if (!global['TextEncoder']) {
    global['TextEncoder'] = TextEncoder;
  }
  if (!global['TextDecoder']) {
    global['TextDecoder'] = TextDecoder;
  }
}

// POLYFILL: fetch
// - Node:
// - Browser: IE11 etc, This polyfill is node only, use external polyfil

if (!isBrowser && typeof global['fetch'] === 'undefined') {
  global['fetch'] = fetchNode;
}
