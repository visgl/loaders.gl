# Introduction

loaders.gl is a growing suite of portable, framework-independent loaders and writers for a range of file formats. The suite focuses on formats for data visualization, currently including 3D point clouds, 3D geometries and assets (e.g images), geospatial formats as well as tabular data.

loaders.gl is part of the [vis.gl](https://vis.gl) framework ecosystem, and while all loaders and writers in loaders.gl are framework-independent, frameworks like [deck.gl](https://deck.gl) and [luma.gl](https://luma.gl) are designed to easily consume data returned by loaders.gl loaders.

## Major Components

- **Loaders and Writers** - The primary offering is a set of loaders (parsers) for various file formats. loaders.gl also offers of writers (encoders) for subset of those formats to support saving data.
- **Core Functions** - While loaders can be used directly, A set of functions that take loader objects as parameters and use them to perform actual loading and parsing from strings, ArrayBuffers, urls etc.
- **Polyfills** - Since loaders.gl is written in modern JavaScript, it depends on some features like `TextDecoder`, `fetch` etc that are not availble in all browsers/Node.js versions. A polyfill module is provided to help when support for older environments.

## Why loaders.gl?

The open source community has already created many excellent loaders for 3D and geospatial formats available under permissive licenses. However, many of these loaders have limitations (e.g. dependencies on a certain WebGL framework) that can make them hard or even impossible to use in some applications. loaders.gl is an effort to collect some of the best existing open source loaders (together with a handful of newly written loaders) and package them all in a unified, portable, framework-independent way.

## Main Design Goals

Some of the key design goals for loaders.gl.

**Framework Agnostic** - loaders.gl is not tied to any specific framework or use case. Supported file formats are parsed into clearly documented, pure JavaScript data structures.

**Loader Categories** - Loaders in the same category return parsed data in a "standardized" way. Thus, all point cloud loaders return typed arrays holding binary data for POSITION, COLOR, etc attributes.

**Binary Data** - Contiguous numeric arrays will always be loaded using JavaScript typed arrays rather than native Arrays.

**Optimized for WebGL** - loaders.gl is optimized for use with WebGL and WebGL frameworks (e.g. by using GPU friendly binary data), however loaders.gl itself does not have any WebGL dependencies.

**Format Autodection** - Applications can work with multiple loaders in a unified way, and loaders.gl can often automatically pick the right loader for a given file.

**Worker Thread Support** - Many loader modules also export a "worker loader" that performs parsing on a worker thread.

**Node Support** - All loaders are tested to work under Node.js.

**Bundle Size Conscious** - Each format is published as an independent npm module, and additionally, individual exports from each module are will be removed during tree-shaking if not imported by the app.

## Code Example

Applications import loaders and use them with the `parse` function as follows:

```js
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await parse(fetch('data.csv'), CSVLoader);
```

Data will now be a an array of objects representing the parsed rows from the CSV file.

## Licenses

loaders.gl currently contains a collection of MIT and Apache licensed loaders. Each loader comes with its own license, so if the distinction matters to you, please check and decide accordingly. However, loaders.gl will not include any loaders with non-permissive, commercial or copy-left licenses.

## Credits and Attributions

loaders.gl is partly a repackaging of superb work done by many others in the open source community. We try to be as explicit as we can about the origins and attributions of each loader, both in the documentation page for each loader and we also strive to preserve any comments relating to authorship and contributions inside forked source code.

Even so, we can make mistakes, and we may note have the full history of the code we are reusing. If you think that we have missed something, or that we could do better in regard to attribution, please let us know.

## Supported Platforms

Our intention is for loaders.gl to work well on recent versions of the major evergreen browsers (Chrome, Firefox, Safari). We also want to support as Node.js (v10+) when `@loaders.gl/polyfills` is installed.

Assuming `@loaders.gl/polyfills` and additional appropriate polyfills are installed, we also have an ambition that loaders.gl should run on Edge, IE11 and Node.js v8, however testing on these platforms is not extensive.
