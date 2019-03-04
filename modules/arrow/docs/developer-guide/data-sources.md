# Data Sources and Sinks

The Arrow JavaScript API is designed to make it easy to work with data sources both in the browser and in Node.js.


## Streams

Both Node and DOM/WhatWG Streams can be used directly

## Fetch Responses

Fetch responses (Promises) can be used where a data source is expected.

## ArrayBuffers

Most data sources accept `Uint8Arrays`.

## AsyncIterators

Async iterators are the most general way to abstract "streaming" data sources and data sinks and are consistently accepted (and in many cased returned) by the Arrow JS API.
