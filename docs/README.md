# Introduction

loaders.gl is a suite of loaders for file formats for big data visualization, including point clouds, 3D geometries, images, geospatial formats as well as tabular data.

loaders.gl is part of the [vis.gl](https://vis.gl) ecosystem, and frameworks like [deck.gl](https://deck.gl) and [luma.gl](https://luma.gl) come pre-integrated with loaders.gl. However all all the provided loaders and writers are framework independent, and can be used by any application.

## Loaders

| Loader Category | Description | 
| --- | --- |
| [Table Loaders](docs/specifications/category-table) | Streaming tabular loaders for CSV, JSON, Arrow etc | 
| [Image Loaders](docs/specifications/category-image) | Loaders for images, data textures, compressed textures, supercompressed textures (Basis), mipmapped arrays, cubemaps, binary image utilities and more. |
| [Pointcloud and Mesh Loaders](docs/specifications/mesh-category) | Loaders for point cloud and simple mesh formats such as Draco, LAS, PCD, PLY and OBJ | 
| [Scenegraph Loaders](docs/specifications/category-scenegraph) | glTF loader |
| [3D Tile Loaders](docs/specifications/category-3d-tiles) | Loaders for 3D tile formats such as 3D Tiles, I3S and potree |
| [Geospatial Loaders](docs/specifications/category-gis) | Loaders for geospatial formats (beyond GeoJSON) such as KML, WKT etc. |

## Quick Code Example

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

To quickly get up to speed on how the loaders.gl API works, please see [Get Started](docs/developer-guide/get-started).

## Why loaders.gl?

Many open source projects already contain excellent loaders for key 3D and geospatial formats under permissive licenses. However, due to design limitations (e.g. dependencies on a certain WebGL framework, not packaged for easy re-use, lack of Node.js support, inability to run in worker threads, lack of streaming support, differing interface conventions etc) these can be hard to use in new applications.

loaders.gl collects some of the best existing and a handful of newly written open source loaders, and package them all in a unified, portable, framework-independent way.

## Main Design Goals

**Framework Agnostic** - Files are parsed into clearly documented data structures (objects + typed arrays) that can be used with any JavaScript framework.

**Worker Support** - Many loaders can run in web workers, keeping the main thread free for other tasks while parsing completes.

**Node Support** - All loaders are work under Node.js, useful for running your unit tests under Node.

**Loader Categories** - loaders.gl groups similar data formats into "categories". loaders in the same category return parsed data in "standardized" form, simplifying handling of multiple related formats.

**Format Autodection** - Applications can specify multiple loaders when parsing a file, and loaders.gl will automatically pick the right loader for a given file.

**Bundle Size Optimized** - Each format is published as an independent npm module to allow cherry-picking, and additionally, modules are setup to let tree-shaking remove any symbols not imported by user.

**Modern JavaScript** - loaders.gl is written in standard ES2018 and uses fresh JavaScript constructs, e.g. async iterators instead of streams, `ArrayBuffer` instead of `Buffer`, etc.

**WebGL Optimized** - loaders.gl is optimized for use with WebGL frameworks (e.g. by returning typed arrays whenever possible). However, there are no any actual WebGL dependencies and loaders can be used without restrictions in non-WebGL applications.

## Supported Platforms

Our intention is for loaders.gl to work well on recent versions of the major evergreen browsers (Chrome, Firefox, Safari, both desktop and mobile). We also support all Node.js LTS versions. (Long-Term Support includes Node 12, Node 10, and Node 8 through December 2019. Node.js support assumes `@loaders.gl/polyfills` is installed).

We also have an ambition that loaders.gl should run on Edge, IE11 and Node.js v8, however this assumes that both `@loaders.gl/polyfills` and additional appropriate polyfills (e.g. babel polyfills) are installed. Testing on these older platforms is limited, so if an issue on these platforms is detected please report it, if there is a clear solution we will try to fix it.

## Licenses, Credits and Attributions

License-wise, loaders.gl currently contains a collection of MIT, BSD and Apache licensed loaders. Each loader comes with its own license, so if the distinction matters to you, please check and decide accordingly. Additional licenses might be included in the future, however loaders.gl will never include code with non-permissive, commercial or copy-left licenses.

Regading attributions, loaders.gl is partly a repackaging of the superb work done by many others in the open source community. We try to be as explicit as we can about the origins and attributions of each loader, both in the documentation page for each loader and in the preservation of comments relating to authorship and contributions inside forked source code.

Even so, we can make mistakes, and we may note have the full history of the code we are reusing. If you think that we have missed something, or that we could do better in regard to attribution, please let us know.
