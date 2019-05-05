## Polyfills

Older browsers (mainly Edge and IE11) as well as Node.js versions prior to v11 do not provide certain classes that loaders.gl depends on.

While there are many good polyfill modules available on `npm`, to make the search for a version that works directly with loaders.gl a little easier, a polyfill module is provided.

To install the polyfills, just import it before you start using loaders.gl.

```js
import '@loaders.gl/polyfills';
import {fetchFile} from '@loaders.gl/core';
```

## Combining with other Polyfills

loaders.gl only installs polyfills if the corresponding global symbol is `undefined`. This means that if another polyfill is already installed when `@loaders.gl/polyfills` is imported, the other polyfill will remain in effect. Since most polyfill libraries work this way, applications can mix and match polyfills by ordering the polyfill import statements appropriately (but see the remarks below for a possible caveat).


## Provided Polyfills

See [API Reference](/docs/api-reference/polyfills).

## Remarks

Applications should typically only install this module if they need to run under older environments. While the polyfills are only installed at runtime if the platform does not already support them, they will still be included in your application bundle, i.e. importing the polyfill module will increase your application's bundle size.

When importing polyfills for the same symbol from different libraries, the import can depend on how the other polyfill is written. to control the order of installation, you may want to use `require` rather than `import` when importing `@loaders.gl/polyfills`. As a general rule, `import` statements execute before `require` statments.

