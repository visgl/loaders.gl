# Overview

The `@loaders.gl/polyfills` module installs support for Node.js. This module should be imported before you call any loaders.gl functionality under Node.js

loaders.gl is based on the HTML5 API provided by modern, evergreen browsers. 

## Installation

```bash
npm install @loaders.gl/polyfills
```

## Usage

Just import `@loaders.gl/polyfills` before you start using other loaders.gl modules.

```typescript
import '@loaders.gl/polyfills';
import '@loaders.gl/core';
```

## Features

The polyfills module installs the following capabilities.

- fetching files from Node file system
- Node Filesystem implementation
- Node ReadableFile and WritableFile implementations
- Node Crypto class
- Node Stream support
- Node library loading
- Image parsing and encoding under Node.js
                                 |
## Deprecated polyfills

Before Node v18, `fetch` needed to be polyfilled. The `@loaders.gl/polyfills` module still conditionally installs a fetch polyfill on Node 16, but this is expected to be removed in next major release.

### fetch Polyfill

The Node.js `fetch`, `Response` and `Headers` polyfills supports a large subset of the browser fetch API, including:

- `Response.text()`, `Response.arrayBuffer()`, `Response.json()`
- `Response.body` stream
- `headers`, `status`, `statusText` etc.
- data uri / base64 decoding
- automatic gzip, brotli and deflate decompression support for responses with `content-encoding` headers.
- Files ending with `.gz` are automatically decompressed with gzip decompression (this is only done on Node.js, in the browser the content-encoding header must be set).

The Node.js `fetch` is able to follow 30X redirect: if `Response` has status 300-399 and `location` header is set, the `fetch` polyfill re-requests data from `location`.

## Remarks

- The polyfills module can safely be imported in the browser. It is designed to be a no-op in this case, though if you are using new cutting-edge bundlers, they may not respect this configuration.

## Attribution

- The `Header` polyfill (for Node.js `fetch`) is a fork of the implementation in https://github.com/github/fetch (MIT license).
- The `Blob` and `File` polyfills are forks of @gozala's [`web-blob`](https://github.com/Gozala/web-blob) and [`web-file`](https://github.com/Gozala/web-file) modules respectively, under MIT license.
