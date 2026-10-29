First steps

# Get started with loaders.gl

Install core and the packages that own your formats, and use one familiar API for local files, URLs, streams, and workers.

[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)[Browse packages](https://loaders.gl/next/docs/packages.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/packages.md)

The loader boundary

## Formats change. The application path can stay the same.

Choose a loader explicitly when the format is known, or let the selector choose from a compatible set. The result remains the shape your application is built to consume.

Input formats

[**Parquet**columnar table↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[**GeoJSON**feature data↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[**glTF / GLB**scenegraph↗](https://loaders.gl/next/docs/modules/scene/gltf/formats/gltf.md)[**LAS / LAZ**point cloud↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)

selec&#x74;**→**

{ }

Loader selection

explicit · list · registry

retur&#x6E;**→**

Application shapes

[**Table**rows or Arrow columns↗](https://loaders.gl/next/docs/specifications/category-table.md)[**Mesh**positions and attributes↗](https://loaders.gl/next/docs/specifications/category-mesh.md)[**Scenegraph**nodes and materials↗](https://loaders.gl/next/docs/specifications/category-scenegraph.md)[**Point cloud**positions and point fields↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

One loader can be precise; a loader list can be flexible; the result contract is still yours.

A minimal first path

## Install one core. Add formats as you need them.

The first application path is deliberately small: install core, choose a format module, load a file, and expand into workers, streams, or sources only when the data requires it.

01

Install

Add @loaders.gl/core and the format modules you use

02

Load

Call load() or parse() with an explicit loader

03

Scale

Register loaders, stream batches, or move work to workers

04

Adapt

Use sources, converters, and writers for larger workflows

Detailed guide

## Setup and first application paths

The guide below covers installation, loading, registration, building, browser support, and Node.js setup.

## Installing[​](#installing "Direct link to Installing")

Install loaders.gl core and the format modules you would like to use.

Related formats share a package. Install the owner package, then import a format subpath. See the [Packages overview](https://loaders.gl/next/docs/packages.md) to choose the packages you need.

```
yarn add @loaders.gl/core @loaders.gl/tables
```

## Usage[​](#usage "Direct link to Usage")

Use `load` to fetch and parse a URL. Use `parse` when you already have the data, such as text, an `ArrayBuffer`, or a `Response`:

```
import {load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const data = await load('data.csv', CSVLoader);
```

### Legacy loader registration[​](#legacy-loader-registration "Direct link to Legacy loader registration")

`registerLoaders` is deprecated. Prefer passing a loader or loader array directly to `load` or `parse`. Existing applications can still register loaders once:

```
import {registerLoaders} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';

registerLoaders([CSVLoader]);
```

Then, in the same file (or some other file in the same app) that needs to load CSV, you can omit the loader argument to `load`. Core selects a registered loader using the URL, MIME type, and available data:

```
import {load} from '@loaders.gl/core';



// The pre-registered CSVLoader gets auto selected based on file extension...

const data = await load('data.csv');
```

## Building[​](#building "Direct link to Building")

You can use your bundler of choice such as webpack or rollup. See the [`get-started`](https://github.com/visgl/loaders.gl/tree/master/examples) examples for minimal working examples of how to bundle loaders.gl.

## Browser support[​](#browser-support "Direct link to Browser support")

Use a modern browser and a bundler that supports ES modules and dynamic imports. The TypeScript build targets ES2022; the distribution does not promise ES5 or IE11 compatibility. Applications targeting older runtimes must configure their own transpilation and provide any missing Web APIs.

## Node.js support[​](#nodejs-support "Direct link to Node.js support")

Modern Node.js provides `fetch`, `Response`, `TextEncoder`, and `TextDecoder`. Import `@loaders.gl/core/polyfills` when you need loaders.gl's Node.js adapters for local files or image decoding. This package is intended for Node.js, not browser polyfills. See [Node.js support](https://loaders.gl/next/docs/developer-guide/node.md) for setup.
