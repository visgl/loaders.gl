# Get Started

## Installing

Install loaders.gl core and loader for any modules you would like to use.

Each format is published as a separate npm module.

```bash
yarn add @loaders.gl/core
yarn add @loaders.gl/gltf
...
```

## Building

loaders.gl is designed to leverage modern JavaScript (ES2018) and to optimize functionality and performance on evergreen browsers.

However, the default distribution is completely transpiled to ES5 so using loaders.gl with older or "slower moving" browsers such as IE11 and Edge is possible if polyfills are added.


## Supporting Older Browsers

To build on Edge and IE11, `TextEncoder` and `TextDecoder` must be polyfilled. There are several polyfills available on `npm`, but you can also use the polyfills provided by loaders.gl

```js
import '@loaders.gl/polyfills';
```


## Running glbdump

Installing `@loaders.gl/gltf` makes the `glbdump` command line tool available to inspect content of gltf files. It can be run using `npx`.

```bash
npx glbdump <filename>
```

