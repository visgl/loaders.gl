# Polyfills

Older browsers (mainly Edge and IE11) as well as versions of Node.js prior to v11 do not provide certain classes that loaders.gl depends on.

While there are many good polyfill modules available on `npm`, to make the search for a version that works perfectly with loaders.gl a little easier, a polyfill module is included.

## Usage

Just import `@loaders.gl/polyfills` before you start using other loaders.gl modules.

```js
import '@loaders.gl/polyfills';
import '@loaders.gl/core';
```

## Included Polyfills

| Polyfill  | Platforms | Comments |
| ---       | ---       | ---      |
| `TextEncoder`/`TextDecoder` | Node.js < 11 and older Browsers | Only UTF8 is guaranteed to be supported |
| `fetch` | Node.js  | A subset of the fetch API is supported. `Response.body`, `.text()`, `.arrayBuffer()` are supported. |


## Remarks

Note: Applications should only install this module if they need to run under older environments. While the polyfills are only installed at runtime if the platform does not already support them, importing this module will increase the application's bundle size.
