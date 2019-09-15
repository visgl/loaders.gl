# Introduction

loaders.gl is a suite of portable, framework-independent loaders and writers for a range of file formats related to geospatial and big data visualization, including point clouds, 3D geometries, images, geospatial formats as well as tabular data.

loaders.gl is a major component of the [vis.gl](https://vis.gl) framework ecosystem. While all the provided loaders and writers are independently usable, frameworks like [deck.gl](https://deck.gl) and [luma.gl](https://luma.gl) are pre-integrated with loaders.gl.

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

## Major Components

- **Loaders** - A suite of _loaders_ for parsing various file formats into well-defined JavaScript data strucutures.
- **Writers** - _writers_ allowing data to be encoded and saved to certain formats.
- **Core Functions** - A set of functions that make it easier to work with loaders and writers.

## Why loaders.gl?

Many open source projects already contain excellent loaders for the key 3D and geospatial formats under permissive licenses. However, due to design limitations (e.g. dependencies on a certain WebGL framework, not packaged for external use, lack of Node.js support etc) these can be hard to use in other applications.

loaders.gl is an effort to collect some of the best existing open source loaders (and a handful of newly written loaders) and package them all in a unified, portable, framework-independent way.

## Main Design Goals

**Framework Agnostic** - Files are parsed into clearly documented data structures, that can be used with any JavaScript framework.

**Loader Categories** - loaders.gl groups similar data formats into "categories". loaders in the same category return parsed data in "standardized" form, simplifying handling of multiple related formats.

**Format Autodection** - Applications can specify multiple loaders when parsing a file, and loaders.gl will automatically pick the right loader for a given file.

**Worker Pools** - Many loaders can run in web workers, keeping the main thread free for other tasks while parsing completes.

**Node Support** - All loaders are work under Node.js, useful for running your unit tests under Node.

**Bundle Size Optimized** - Each format is published as an independent npm module to allow cherry-picking, and additionally, modules are setup to let tree-shaking remove any symbols not imported by user.

Note that while loaders.gl is optimized for use with WebGL frameworks (e.g. by returning typed arrays whenever possible), it does not have any actual WebGL dependencies and can be used without restrictions in non-WebGL applications.

## Supported Platforms

Our intention is for loaders.gl to work well on recent versions of the major evergreen browsers (Chrome, Firefox, Safari, both desktop and mobile). We also support as Node.js v10+ (assuming `@loaders.gl/polyfills` is installed).

We also have an ambition that loaders.gl should run on Edge, IE11 and Node.js v8, however this assumes that both `@loaders.gl/polyfills` and additional appropriate polyfills (e.g. babel polyfills) are installed. Testing on these older platforms is limited.

## Licenses, Credits and Attributions

License-wise, loaders.gl currently contains a collection of MIT and Apache licensed loaders. Each loader comes with its own license, so if the distinction matters to you, please check and decide accordingly. Additional licenses might be included in the future, however loaders.gl will never include code with non-permissive, commercial or copy-left licenses.

Regading attributions, loaders.gl is partly a repackaging of the superb work done by many others in the open source community. We try to be as explicit as we can about the origins and attributions of each loader, both in the documentation page for each loader and in the preservation of comments relating to authorship and contributions inside forked source code.

Even so, we can make mistakes, and we may note have the full history of the code we are reusing. If you think that we have missed something, or that we could do better in regard to attribution, please let us know.
