Texture API / Crunch loader

Crunch

# Keep an existing compressed texture pipeline moving.

CrunchWorkerLoader reads CRN assets and returns mip levels with compressed texture metadata. It is a compatibility path for older BC/DXT-oriented content; new cross-device pipelines generally prefer Basis Universal in KTX2.

[Crunch format](https://loaders.gl/next/docs/modules/textures/formats/crunch.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/crunch.md)[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[Basis format](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

Crunch[Crunch](https://loaders.gl/next/docs/modules/textures/formats/crunch.md)[CrunchWorkerLoader](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md)

Compatibility loader

## Decode the legacy container, keep the GPU decision explicit.

The loader preserves compressed levels and their format metadata. The consuming runtime decides whether those blocks can be uploaded directly or need a migration/transcode path.

01

Input

Crunch \`.crn\` compressed texture files.

02

Decode

Read compressed mip levels through the worker path.

03

Describe

Expose dimensions, level shapes, and texture formats.

04

Migrate

Use KTX2/Basis for new portable asset pipelines.

Detailed guide

## CrunchWorkerLoader reference

The detailed reference covers CRN input, worker loading, mip-level output, format metadata, and compatibility considerations.

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

Loader for compressed textures in the Crunch file format

| CrunchWorkerLoader |                                              |
| ------------------ | -------------------------------------------- |
| File Format        | [CRN](https://github.com/BinomialLLC/crunch) |
| File Extension     | `.crn`                                       |
| File Type          | Binary                                       |
| Data Format        | `TextureLevel[]`                             |
| Supported APIs     | `load`, `parse`                              |

## Usage[​](#usage "Direct link to Usage")

```
import {CrunchWorkerLoader} from '@loaders.gl/textures';

import {load} from '@loaders.gl/core';



const mipLevels = await load(url, CrunchWorkerLoader);

for (const level of mipLevels) {

  console.log(level.shape, level.format, level.textureFormat);

}
```

## Data Format[​](#data-format "Direct link to Data Format")

Returns `TextureLevel[]`, one entry per mip level.

Each level includes:

* `shape: 'texture-level'` ![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)
* `compressed`
* `format` ![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)
* `textureFormat` ![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)
* `width`
* `height`
* `data`
* `levelSize` when available

## Options[​](#options "Direct link to Options")

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    |      |         |             |

## Module Overrides[​](#module-overrides "Direct link to Module Overrides")

Use `options.modules` to override the Crunch runtime used by `CrunchWorkerLoader`.

* `modules.crunch`: supply a preloaded Crunch decoder factory.
* `'crunch.js'`: override the URL used for the Crunch decoder script.
