Server-side JavaScript

# Use the same loaders in Node.js and the browser.

loaders.gl uses portable Web APIs and provides Node.js adapters for local files, images, streams, and crypto.

[Polyfills module](https://loaders.gl/next/docs/modules/core/polyfills/api-reference.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/polyfills/api-reference.md)[Preferred JavaScript APIs](https://loaders.gl/next/docs/developer-guide/concepts/javascript-apis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/concepts/javascript-apis.md)

The Node.js boundary

## Install the platform pieces, keep the data path portable.

Import polyfills when the runtime needs them. The core loaders continue to use browser-compatible abstractions for fetching, files, streams, and binary data.

01

Setup

Import @loaders.gl/core/polyfills when required

02

Core

Use fetch, Response, and ArrayBuffer APIs

03

Files

Adapt local data through readable-file APIs

04

Compatibility

Keep application code portable where useful

loaders.gl uses portable Web APIs such as `ArrayBuffer`, `Response`, and Web Streams. Modern Node.js provides the basic APIs needed to parse in-memory data and load HTTP URLs.

## Supported Node.js versions[​](#supported-nodejs-versions "Direct link to Supported Node.js versions")

loaders.gl supports all current Node.js [LTS releases](https://nodejs.org/en/about/previous-releases). End-of-life Node.js versions are not supported.

Use the latest Node.js patch release when loading untrusted Brotli data. Node.js’s bundled decoder is used by `fetch()`, `@loaders.gl/core/polyfills`, and `BrotliDecompressor`. See the [October 2026 Node.js security notice](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).

## Node.js adapters[​](#nodejs-adapters "Direct link to Node.js adapters")

Install and import `@loaders.gl/core/polyfills` before using features that require its Node.js adapters, including local-file loading and image decoding:

```
yarn add @loaders.gl/core
```

```
import '@loaders.gl/core/polyfills';

import {load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const table = await load('data.csv', CSVLoader);
```

The package registers filesystem, image, stream, and crypto adapters with loaders.gl. It also supplies missing globals where applicable. Do not import it in a browser bundle.

## Combining polyfills[​](#combining-polyfills "Direct link to Combining polyfills")

Global polyfills are installed only when the corresponding global is absent. Import another polyfill first if you want its implementation to take precedence. The loaders.gl adapters are registered separately from these globals.

See the [polyfills API reference](https://loaders.gl/next/docs/modules/core/polyfills/api-reference.md) for details.
