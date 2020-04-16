# Get Started

## Installing

Install loaders.gl core and loader for any modules you would like to use.

Each format is published as a separate npm module.

```bash
yarn add @loaders.gl/core
yarn add @loaders.gl/gltf
...
```

## Usage

You can import a loader and use it directly with `parse`. Note that `parse` can accept a `fetch` response object as the source of data to be parsed:

```js
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
const data = await parse(fetch('data.csv'), CSVLoader);
```

You can register loaders after importing them

```js
import {registerLoaders} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
registerLoaders(CSVLoader);
```

Then, in the same file (or some other file in the same app) that needs to load CSV, you no longer need to supply the loader to `parse`. It will autodetect the pre-registered loader:

```js
import {parse} from '@loaders.gl/core';

// The pre-registered CSVLoader gets auto selected based on file extension...
const data = await parse(fetch('data.csv'));
```

## Building

You can use your bundler of choice such as webpack or rollup. See the [`get-started-...`](https://github.com/visgl/loaders.gl/tree/master/examples) examples for minimal working examples of how to bundle loaders.gl.

## Supporting Older Browsers

loaders.gl is designed to leverage modern JavaScript (ES2018) and to optimize functionality and performance on evergreen browsers.

However, the default distribution is completely transpiled to ES5 so using loaders.gl with older or "slower moving" browsers such as IE11 and Edge is possible, assuming that the appropriate polyfills are installed.

To build on Edge and IE11, `TextEncoder` and `TextDecoder` must be polyfilled. There are several polyfills available on `npm`, but you can also use the polyfills provided by loaders.gl:

```bash
yarn install @loaders.gl/polyfills
```

```js
import '@loaders.gl/polyfills';
```

## Supporting Node.js

A number of polyfills for `fetch`, `TextEncoder` etc are available to make loaders.gl work under Node.js, just install the `@loaders.gl/polyfills module` as described above.
