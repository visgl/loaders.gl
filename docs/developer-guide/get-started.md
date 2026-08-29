---
title: Get Started
description: Install the core package, choose a loader, and load your first file.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="First steps"
  title="Get started with loaders.gl"
  description="Install the small core package, add only the format modules you need, and use one familiar API for local files, URLs, streams, and workers."
  tone="blue"
  meta={['Install by format', 'load() and parse()', 'Browser and Node.js']}
  links={[
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'},
    {label: 'Browse modules', to: '/docs'}
  ]}
/>

<DocOrientation
  eyebrow="A minimal first path"
  title="Install one core. Add formats as you need them."
  description="The first application path is deliberately small: install core, choose a format module, load a file, and expand into workers, streams, or sources only when the data requires it."
  tone="blue"
  items={[
    {label: 'Install', value: 'Add @loaders.gl/core and the format modules you use'},
    {label: 'Load', value: 'Call load() or parse() with an explicit loader'},
    {label: 'Scale', value: 'Register loaders, stream batches, or move work to workers'},
    {label: 'Adapt', value: 'Use sources, converters, and writers for larger workflows'}
  ]}
/>

<ReferenceBoundary
  title="Setup and first application paths"
  description="The guide below covers installation, loading, registration, building, browser support, and Node.js setup."
  tone="blue"
/>

## Installing

Install loaders.gl core and the format modules you would like to use.

Each format is published as a separate npm module.

```shell
yarn add @loaders.gl/core @loaders.gl/gltf
```

## Usage

You can import a loader and use it directly with `parse`. Note that `parse` can accept a `fetch` response object as the source of data to be parsed:

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await load('data.csv', CSVLoader);
```

You can register loaders after importing them

```typescript
import {registerLoaders} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
registerLoaders([CSVLoader]);
```

Then, in the same file (or some other file in the same app) that needs to load CSV, you no longer need to supply the loader to `parse`. It will autodetect the pre-registered loader:

```typescript
import {load} from '@loaders.gl/core';

// The pre-registered CSVLoader gets auto selected based on file extension...
const data = await load('data.csv');
```

## Building

You can use your bundler of choice such as webpack or rollup. See the [`get-started`](https://github.com/visgl/loaders.gl/tree/master/examples) examples for minimal working examples of how to bundle loaders.gl.

## Supporting Older Browsers

loaders.gl is designed to leverage modern JavaScript (ES2018) and to optimize functionality and performance on evergreen browsers.

However, the default distribution is completely transpiled to ES5 so using loaders.gl with older or "slower moving" browsers such as IE11 and Edge is possible, assuming that the appropriate polyfills are installed.

To build on Edge and IE11, `TextEncoder` and `TextDecoder` must be polyfilled. There are several polyfills available on `npm`, but you can also use the polyfills provided by loaders.gl:

```bash
yarn add @loaders.gl/polyfills
```

```typescript
import '@loaders.gl/polyfills';
```

## Supporting Node.js

A number of polyfills for `fetch`, `TextEncoder` etc are available to make loaders.gl work under Node.js, just install the `@loaders.gl/polyfills module` as described above.
