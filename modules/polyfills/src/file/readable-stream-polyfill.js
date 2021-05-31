const {ReadableStream} = require('web-streams-polyfill');

// Want a polyfill, but please don't install it
// @ts-ignore
delete global.ReadableStream;

module.exports.ReadableStreamPolyfill = ReadableStream;
