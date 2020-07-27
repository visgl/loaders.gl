# Introduction

<p align="center">
  <img src="https://img.shields.io/badge/loaders.gl-v2.2-blue.svg?style=flat-square" />
</p>

<p align="center">
  Docs for older versions are available on github, e.g.
  <a href="https://github.com/visgl/loaders.gl/blob/2.1-release/docs/README.md">
    <img src="https://img.shields.io/badge/loaders.gl-v2.1-green.svg?style=flat-square" />
  </a>
  <a href="https://github.com/visgl/loaders.gl/blob/1.3-release/docs/README.md">
    <img src="https://img.shields.io/badge/loaders.gl-v1.3-green.svg?style=flat-square" />
  </a>
</p>

loaders.gl is a suite of loaders for file formats focused on visualization of big data, including point clouds, 3D geometries, images, geospatial formats as well as tabular data.

loaders.gl is part of the [vis.gl](https://vis.gl) ecosystem, and frameworks like [deck.gl](https://deck.gl) and [luma.gl](https://luma.gl) come pre-integrated with loaders.gl. However, all the provided loaders and writers are framework-independent, and can be used with any application or framework.

## Loaders

loaders.gl provides a wide selection of loaders organized into categories:

| Category                                                         | Loaders                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Table Loaders](docs/specifications/category-table)              | Streaming tabular loaders for [CSV](modules/csv/docs/api-reference/csv-loader), [JSON](modules/json/docs/api-reference/json-loader), [Arrow](modules/arrow/docs/api-reference/arrow-loader) etc                                                                                                                                                                                                                                                                                |
| [Image Loaders](docs/specifications/category-image)              | Loaders for [images](modules/images/docs/api-reference/image-loader), [compressed textures](modules/basis/docs/api-reference/compressed-texture-loader), [supercompressed textures (Basis)](modules/basis/docs/api-reference/basis-loader). Utilities for [mipmapped arrays](modules/images/docs/api-reference/load-image-array), [cubemaps](modules/images/docs/api-reference/load-image-cube), [binary images](modules/images/docs/api-reference/binary-image-api) and more. |
| [Pointcloud and Mesh Loaders](docs/specifications/mesh-category) | Loaders for point cloud and simple mesh formats such as [Draco](modules/draco/docs/api-reference/draco-loader), [LAS](modules/las/docs/api-reference/las-loader), [PCD](modules/pcd/docs/api-reference/pcd-loader), [PLY](modules/ply/docs/api-reference/ply-loader), [OBJ](modules/obj/docs/api-reference/obj-loader), and [Terrain](modules/terrain/docs/api-reference/terrain-loader).                                                                                      |
| [Scenegraph Loaders](docs/specifications/category-scenegraph)    | [glTF](modules/gltf/docs/api-reference/gltf-loader) loader                                                                                                                                                                                                                                                                                                                                                                                                                     |
| [3D Tile Loaders](docs/specifications/category-3d-tiles)         | Loaders for 3D tile formats such as [3D Tiles](modules/3d-tiles/docs/api-reference/tile-3d-loader), [I3S](modules/i3s/docs/api-reference/i3s) and potree                                                                                                                                                                                                                                                                                                                       |
| [Geospatial Loaders](docs/specifications/category-gis)           | Loaders for geospatial formats such as [GeoJSON](<(modules/json/docs/api-reference/geojson-loader)>) [KML](modules/kml/docs/api-reference/kml-loader), [WKT/WKB](modules/wkt/docs/api-reference/wkt-loader), [Mapbox Vector Tiles](modules/mvt/docs/api-reference/mvt-loader) etc.                                                                                                                                                                                             |

## Quick Code Examples

loaders.gl provides a small core API module with common functions to load and save data, and a number of additional modules that provide loaders and writers for specific file formats.

A minimal example using the `load` function and the `CSVLoader` to load a CSV formatted table into a JavaScript array:

```js
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await load('data.csv', CSVLoader);

for (const row of data) {
  console.log(JSON.stringify(row)); // => '{header1: value1, header2: value2}'
}
```

Streaming parsing is available using ES2018 async iterators, allowing "larger than memory" files to be processed:

```js
import {loadInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

for await (const batch of await loadInBatches('data.csv', CSVLoader)) {
  for (const row of batch) {
    console.log(JSON.stringify(row)); // => '{header1: value1, header2: value2}'
  }
}
```

To quickly get up to speed on how the loaders.gl API works, please see [Get Started](docs/developer-guide/get-started).

## Why loaders.gl?

loaders.gl collects a mix of the best existing and a handful of newly written loaders, and package them all in a consistent, portable, framework-independent open source module suite.

There were already many excellent open source loaders available on e.g github and npm. However, these can be sometimes be hard to use in applications, due to various limitations such as:

- dependencies on a certain framework you are not able to use
- not packaged for easy (re)use
- Lack of Node.js support or browser support
- inability to run in worker threads
- lack of streaming support
  etc.

## Supported Platforms

loaders.gl provides consistent support for both browsers and Node.js. The following platforms are supported:

- **Evergreen Browsers** loaders.gl supports recent versions of the major evergreen browsers (e.g. Chrome, Firefox, Safari) on both desktop and mobile.
- **Edge and IE11** loaders.gl runs on Edge and IE11, assuming that both `@loaders.gl/polyfills` and additional appropriate polyfills (e.g. babel polyfills) are installed. Note that testing on these older platforms is less frequent, so temporary regressions can occur.
- **Node.js** LTS (Long-Term Support) [releases](https://nodejs.org/en/about/releases/) are also supported through the `@loaders.gl/polyfills` module.

## Main Design Goals

**Framework Agnostic** - Files are parsed into clearly documented data structures (objects + typed arrays) that can be used with any JavaScript framework.

**Worker Support** - Many loaders run in web workers, keeping the main thread free for other tasks while parsing completes.

**Streaming Support** - Several loaders can parse in batches from both node and browser `Stream`s, allowing "larger than memory" files to be processed, and initial results to be available while the remainder of a file is still loading.

**Node Support** - All loaders work under Node.js and can be used when writing backend and cloud services, and when running your unit tests under Node.

**Loader Categories** - loaders.gl groups similar data formats into "categories". loaders in the same category return parsed data in "standardized" form, simplifying applications that want to handle multiple related formats.

**Format Autodection** - Applications can specify multiple loaders when parsing a file, and loaders.gl will automatically pick the right loader for a given file based on file extension, MIME type and file header.

**Bundle Size Optimized** - Each format is published as an independent npm module to allow applications to cherry-pick only the loaders it needs, modules are optimized for tree-shaking, large loader libraries and workers are loaded from CDN and not bundled.

**Modern JavaScript** - loaders.gl is written in standard ES2018 and the API emphasizes modern, portable JavaScript constructs, e.g. async iterators instead of streams, `ArrayBuffer` instead of `Buffer`, etc.

**Binary Data Optimized** - loaders.gl is optimized for use with WebGL frameworks (e.g. by returning typed arrays whenever possible). However, there are no any actual WebGL dependencies and loaders can be used without restrictions in non-WebGL applications.

**Multi-Asset Loading** - Some formats like glTF, or mipmapped cube textures, can required dozens of separate loads to resolve all linked assets (external buffers, images etc). Tracking all the resulting async loads can cause complications for applications. By default, loaders.gl loads all linked assets before resolving a returned `Promise`.

## Licenses, Credits and Attributions

loaders.gl contains code under several permissive open source licenses, currently MIT, BSD and Apache licenses. Additional licenses might be included in the future, however loaders.gl will never include code with non-permissive, commercial or copy-left licenses.

Note that each loader module comes with its own license, so if the distinction matters to you, please check and decide accordingly.

Regading attributions, loaders.gl is partly a repackaging of superb work done by many others in the open source community. We try to be as explicit as we can about the origins and attributions of each loader, both in the documentation page for each loader and in the preservation of comments relating to authorship and contributions inside forked source code.

Even so, we can make mistakes, and we may not have the full history of the code we are reusing. If you think that we have missed something, or that we could do better in regard to attribution, please let us know.
