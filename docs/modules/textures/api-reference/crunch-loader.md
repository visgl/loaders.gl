---
title: CrunchWorkerLoader
description: Decode legacy Crunch texture files in a worker-friendly path and expose their compressed mip levels.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Texture API / Crunch loader"
  title="Keep an existing compressed texture pipeline moving."
  description="CrunchWorkerLoader reads CRN assets and returns mip levels with compressed texture metadata. It is a compatibility path for older BC/DXT-oriented content; new cross-device pipelines generally prefer Basis Universal in KTX2."
  tone="pink"
  meta={['CRN input', 'Compressed mip levels', 'Worker loader']}
  links={[
    {label: 'Crunch format', to: '/docs/modules/textures/formats/crunch'},
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'Basis format', to: '/docs/modules/textures/formats/basis'}
  ]}
/>

<TexturesDocsTabs active="crunchloader" />

<DocOrientation
  eyebrow="Compatibility loader"
  title="Decode the legacy container, keep the GPU decision explicit."
  description="The loader preserves compressed levels and their format metadata. The consuming runtime decides whether those blocks can be uploaded directly or need a migration/transcode path."
  tone="pink"
  items={[
    {label: 'Input', value: 'Crunch `.crn` compressed texture files.'},
    {label: 'Decode', value: 'Read compressed mip levels through the worker path.'},
    {label: 'Describe', value: 'Expose dimensions, level shapes, and texture formats.'},
    {label: 'Migrate', value: 'Use KTX2/Basis for new portable asset pipelines.'}
  ]}
/>

<ReferenceBoundary
  title="CrunchWorkerLoader reference"
  description="The detailed reference covers CRN input, worker loading, mip-level output, format metadata, and compatibility considerations."
  tone="pink"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Loader for compressed textures in the Crunch file format

| Loader         | Characteristic                               |
| -------------- | -------------------------------------------- |
| File Format    | [CRN](https://github.com/BinomialLLC/crunch) |
| File Extension | `.crn`                                       |
| File Type      | Binary                                       |
| Data Format    | `TextureLevel[]`                             |
| Supported APIs | `load`, `parse`                              |

## Usage

```typescript
import {CrunchWorkerLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const mipLevels = await load(url, CrunchWorkerLoader);
for (const level of mipLevels) {
  console.log(level.shape, level.format, level.textureFormat);
}
```

## Data Format

Returns `TextureLevel[]`, one entry per mip level.

Each level includes:

- `shape: 'texture-level'` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `compressed`
- `format` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `textureFormat` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `width`
- `height`
- `data`
- `levelSize` when available

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    |      |         |             |

## Module Overrides

Use `options.modules` to override the Crunch runtime used by `CrunchWorkerLoader`.

- `modules.crunch`: supply a preloaded Crunch decoder factory.
- `'crunch.js'`: override the URL used for the Crunch decoder script.
