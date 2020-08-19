const {ReadableStream} = require('web-streams-polyfill');

// Want a polyfill, but please don't install it
/* global global */
delete global.ReadableStream;

module.exports.ReadableStreamPolyfill = ReadableStream;
