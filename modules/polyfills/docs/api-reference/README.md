# Overview

The `@loaders.gl/polyfills` provides optional support for Node.js and older browsers.

Older browsers (mainly Edge and IE11) as well as versions of Node.js prior to v11 do not provide certain classes that loaders.gl depends on.

Note that while `@loaders.gl/polyfills` is designed to work perfectly with other loaders.gl modules, there are other good polyfill modules available on `npm` that can also be used.

## Installation

```bash
npm install @loaders.gl/polyfills
```

## Usage

Just import `@loaders.gl/polyfills` before you start using other loaders.gl modules.

```js
import '@loaders.gl/polyfills';
import '@loaders.gl/core';
```

## Included Polyfills

| Polyfill                    | Node         | Browser              | Comments                                                                                                                                                                                    |
| --------------------------- | ------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextEncoder`/`TextDecoder` | Node.js < 11 | Yes (Older browsers) | Only UTF8 is guaranteed to be supported                                                                                                                                                     |
| `atob`/`btoa`               | All versions | No                   | Note: these functions are [not unicode safe](https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem), but OK to use for test cases. |
| `fetch`                     | All versions | No                   | A subset of the fetch API is supported, see below.                                                                                                                                          | `Response` | All versions | No | A subset of the `Response` API is supported, see below. | `Headers` | All versions | No | A subset of the fetch API is supported, see below. |

## fetch Polyfill

The Node.js `fetch`, `Response` and `Headers` polyfills supports a large subset of the browser fetch API, including:

- `Response.text()`, `Response.arrayBuffer()`, `Response.json()`
- `Response.body` stream
- `headers`, `status`, `statusText` etc.
- data uri / base64 decoding
- automatic gzip, brotli and deflate decompression support for responses with `content-encoding` headers.
- Files ending with `.gz` are automatically decompressed with gzip decompression (this is only done on Node.js, in the browser the content-encoding header must be set).

# TextEncoder and TextDecoder Polyfills

`TextEncoder` and `TextDecoder` polyfills are provided to ensure these APIs are always available. In modern browsers these will evaluate to the built-in objects of the same name, however under Node.js polyfills are transparently installed.

Note: The provided polyfills only guarantee UTF8 support.

## Remarks

- Applications should only install this module if they need to run under older environments. While the polyfills are only installed at runtime if the platform does not already support them, importing this module will increase the application's bundle size.
- Refer to browser documentation for the usage of these classes, e.g. MDN.
- In the browser, overhead of using these imports is not as high, as most polyfills are only bundled under Node.js.
- If working under older browsers, e.g. IE11, you may need to install your own TextEncoder/TextDecoder polyfills before loading this library

## Attribution

The `Header` polyfill (for Node.js `fetch`) is a fork of the implementation in https://github.com/github/fetch (MIT license).
