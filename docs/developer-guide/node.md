# Node.js support

Firstly, to run loaders.gl on Node.js you want to import the `@loaders.gl/polyfills` module.

Also it is good to understand that loaders.gl avoids using Node.js specific APIs (such as Buffer, path, util, fs, streams etc) instead favoring browser compatible equivalents. loaders.gl is optimized for cross-platform compatible APIs.

However, if your goal is to write Node.js-idiomatic code rather than browser-portable code, you may find that working with loaders.gl can require some extra work.

## Supported Node.js versions

loaders.gl supports all current Node.js [LTS releases](https://nodejs.org/en/about/previous-releases).
End-of-life Node.js versions are not supported.

Node.js ships security fixes only as patch releases, so use the latest patch release of
your Node.js version. This matters in particular when loading data from untrusted sources:
under Node.js, Brotli-compressed data is decoded by the Brotli decoder bundled with Node.js.
This includes `.br` files loaded through `@loaders.gl/polyfills`, responses with Brotli
`content-encoding` returned by the built-in `fetch()`, and `BrotliCompression` in
`@loaders.gl/compression` when the `brotli.useZlib` option is set.

## Polyfills

To install these polyfills, just `import` the polyfills module before start using loaders.gl.

```typescript
import '@loaders.gl/polyfills';
import {parse} from '@loaders.gl/core';
```

## Combining with other Polyfills

loaders.gl only installs polyfills if the corresponding global symbol is `undefined`. This means that if another polyfill is already installed when `@loaders.gl/polyfills` is imported, the other polyfill will remain in effect. Since most polyfill libraries work this way, applications can mix and match polyfills by ordering the polyfill import statements appropriately (but see the remarks below for a possible caveat).

## Provided Polyfills

See [API Reference](/docs/modules/polyfills/api-reference).

## Remarks
