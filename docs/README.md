# Introduction

loaders.gl is a growing suite of portable, framework-independent loaders and writers for a range of file formats related to geospatial and big data visualization.

Formats supported currently include a variety of point cloud formats, 3D geometries, images, geospatial formats as well as tabular data.

loaders.gl is part of the [vis.gl](https://vis.gl) framework ecosystem, and while all the provided loaders and writers are independently usable, frameworks like [deck.gl](https://deck.gl) and [luma.gl](https://luma.gl) are pre-integrated with loaders.gl.

## Quick Code Example

To quickly get a sense for how the loaders.gl API works, please see [Get Started](docs/developer-guide/get-started).

A minimal example to load a CSV formatted table into a JavaScript array:

```js
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await parse(fetch('data.csv'), CSVLoader);

for (const row of data) {
  console.log(JSON.stringify(row)); // => '{header1: value1, header2: value2}'
}
```

## Major Components

- **Loaders** - A suite of *loaders* for parsing various file formats into well-defined JavaScript data strucutures.
- **Writers** - *writers* allowing data to be encoded and saved certain formats.
- **Core Functions** - A set of functions that make it easier to work with loaders and writers.
- **Node Polyfills** - loaders.gl works seamlessly on Node.js, via a set of easily installed polyfills.

## Why loaders.gl?

Many open source projects already contain excellent loaders for the key 3D and geospatial formats under permissive licenses. However, due to design limitations (e.g. dependencies on a certain WebGL framework, not packaged for external use, lack of Node.js support etc) these can be hard to use in other applications.

loaders.gl is an effort to collect some of the best existing open source loaders (and a handful of newly written loaders) and package them all in a unified, portable, framework-independent way.

## Main Design Goals

**Framework Agnostic** - loaders.gl is not tied to any specific framework or use case. Supported file formats are parsed into clearly documented, pure JavaScript data structures.

**Loader Categories** - Loaders in the same category return parsed data in a "standardized" way. Thus, all point cloud loaders return typed arrays holding binary data for POSITION, COLOR, etc attributes.

**Binary Data** - Contiguous numeric arrays will always be loaded using JavaScript typed arrays rather than native Arrays.

**Optimized for WebGL** - loaders.gl is optimized for use with WebGL and WebGL frameworks (e.g. by using GPU friendly binary data), however loaders.gl itself does not have any WebGL dependencies.

**Format Autodection** - Applications can work with multiple loaders in a unified way, and loaders.gl can often automatically pick the right loader for a given file.

**Worker Thread Support** - Many loader modules also export a "worker loader" that performs parsing on a worker thread.

**Node Support** - All loaders are tested to work under Node.js.

**Bundle Size Conscious** - Each format is published as an independent npm module, and additionally, individual exports from each module are will be removed during tree-shaking if not imported by the app.

## Supported Platforms

Our intention is for loaders.gl to work well on recent versions of the major evergreen browsers (Chrome, Firefox, Safari). We also want to support as Node.js (v10+) when `@loaders.gl/polyfills` is installed.

Assuming `@loaders.gl/polyfills` and additional appropriate polyfills (e.g. babel polyfills) are installed, we also have an ambition that loaders.gl should run on Edge, IE11 and Node.js v8, however testing on these platforms is not extensive.

## Licenses, Credits and Attributions

loaders.gl currently contains a collection of MIT and Apache licensed loaders. Each loader comes with its own license, so if the distinction matters to you, please check and decide accordingly. Additional licenses might be considered in the future, however loaders.gl will never include code with non-permissive, commercial or copy-left licenses.

loaders.gl is partly a repackaging of superb work done by many others in the open source community. We try to be as explicit as we can about the origins and attributions of each loader, both in the documentation page for each loader and in the preservation of comments relating to authorship and contributions inside forked source code.

Even so, we can make mistakes, and we may note have the full history of the code we are reusing. If you think that we have missed something, or that we could do better in regard to attribution, please let us know.
