---
title: Get Started
description: Install the core package, choose a loader, and load your first file.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {LoaderSelectionGraphic} from '@site/src/components/docs/loader-selection-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="First steps"
  title="Get started with loaders.gl"
  description="Install core and the packages that own your formats, and use one familiar API for local files, URLs, streams, and workers."
  tone="blue"
  meta={['Install by package', 'load() and parse()', 'Browser and Node.js']}
  links={[
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'},
    {label: 'Browse modules', to: '/docs/modules'}
  ]}
/>

<LoaderSelectionGraphic />

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

Related formats share a package. Install the owner package, then import a format subpath. See the [Modules](../modules/README.md) to choose the packages you need.

```shell
yarn add @loaders.gl/core @loaders.gl/tables
```

## Usage

Use `load` to fetch and parse a URL. Use `parse` when you already have the data, such as text, an `ArrayBuffer`, or a `Response`:

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables/csv';

const data = await load('data.csv', CSVLoader);
```

### Legacy loader registration

`registerLoaders` is deprecated. Prefer passing a loader or loader array directly
to `load` or `parse`. Existing applications can still register loaders once:

```typescript
import {registerLoaders} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables/csv';
registerLoaders([CSVLoader]);
```

Then, in the same file (or some other file in the same app) that needs to load CSV, you can omit the loader argument to `load`. Core selects a registered loader using the URL, MIME type, and available data:

```typescript
import {load} from '@loaders.gl/core';

// The pre-registered CSVLoader gets auto selected based on file extension...
const data = await load('data.csv');
```

## Building

You can use your bundler of choice such as webpack or rollup. See the [`get-started`](https://github.com/visgl/loaders.gl/tree/master/examples) examples for minimal working examples of how to bundle loaders.gl.

## Browser support

Use a modern browser and a bundler that supports ES modules and dynamic imports.
The TypeScript build targets ES2022; the distribution does not promise ES5 or IE11
compatibility. Applications targeting older runtimes must configure their own
transpilation and provide any missing Web APIs.

## Node.js support

Modern Node.js provides `fetch`, `Response`, `TextEncoder`, and `TextDecoder`.
Import `@loaders.gl/core/polyfills` when you need loaders.gl's Node.js adapters for
local files or image decoding. This package is intended for Node.js, not browser
polyfills. See [Node.js support](/docs/developer-guide/node) for setup.

## Install packages, import subpaths

```bash
npm install @loaders.gl/core @loaders.gl/pointclouds @loaders.gl/scene
```

```typescript
import {parse, parseSync} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/pointclouds/ply';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {PLYLoaderWithParser} from '@loaders.gl/pointclouds/ply-loader';

const points = await parse(plyBytes, PLYLoader);
const scene = await parse(gltfBytes, GLTFLoader);
const mesh = parseSync(plyBytes, PLYLoaderWithParser, {ply: {shape: 'mesh'}});
```

These metadata loaders preload their parser when passed to an async core API. Synchronous APIs require a parser-bearing implementation. Entrypoint contracts vary by package; follow the owning reference. See [Packages and format entrypoints](./grouped-packages.md) for the complete import and dependency model.

Subpaths are not separately installable packages. They control code loading; ordinary dependencies are installed for the whole package. Optional engines and codecs may need an additional installation. Worker and WASM assets must match the installed package version.

Core utilities are documented under core. Core implementations do not depend on domain packages. Specialized scan, arrow-geometry, geoarrow, and WKT utilities require explicit subpath imports. Geometry loaders and writers belong to geospatial; point-cloud tile traversal belongs to tiles-3d.
