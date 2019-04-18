# Get Started

## Installing

```
yarn add loaders.gl
```

## Running glbdump

Installing loaders.gl makes the `glbdump` command line tool available. It can be run using `npx`.

```
$ npx glbdump <filename>
```


## Building

loaders.gl is designed to leverage modern JavaScript (ES2018) and to optimize functionality and performance on evergreen browsers.

That saud, the default distribution is completely transpiled to ES5 so using loaders.gl with older or "slower moving" browsers such as IE11 and Edge is possible if polyfills are added.


To build on Edge, `TextEncoder` and `TextDecoder` must be polyfilled. There are several polyfills available on `npm`.

```
yarn add text-encoding
```

```js
import 'text-encoding'; // Polyfills TextEncoder and TextDecoder for IE11 and Edge
import '@loaders.gl/core';
```
