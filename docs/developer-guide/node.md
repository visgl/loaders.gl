# Node.js support

Firstly, to run loaders.gl on Node.js you want to import the `@loaders.gl/polyfills` module.

Also it is good to understand that loaders.gl avoids using Node.js specific APIs (such as Buffer, path, util, fs, streams etc) instead favoring browser compatible equivalents. loaders.gl is optimized for cross-platform compatible APIs. 

However, if your goal is to write Node.js-idiomatic code rather than browser-portable code, you may find that working with loaders.gl can require some extra work.

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

