---
title: '@loaders.gl/flatgeobuf'
description: Read FlatGeobuf vector data with spatial indexing, range requests, and Arrow feature tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Cloud-native vector module"
  title="Ask a vector file for the features in a box."
  description="FlatGeobuf combines a binary feature layout with a spatial index that can be read over HTTP ranges. The module turns that into a loader and source for bounded vector access and Arrow feature tables."
  tone="orange"
  meta={['FlatBuffers', 'Spatial index', 'Arrow features']}
  links={[
    {label: 'FlatGeobuf format', to: '/docs/modules/flatgeobuf/formats/flatgeobuf'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<DocOrientation
  eyebrow="The FlatGeobuf path"
  title="Use the index before decoding features."
  description="A source can discover the header and packed R-tree, select candidate features by bounds, then decode only the ranges needed for the request."
  tone="orange"
  items={[
    {label: 'Index', value: 'Packed R-tree for spatial candidate selection'},
    {label: 'Access', value: 'HTTP range reads for cloud-hosted files'},
    {label: 'Output', value: 'GeoJSON-like features or Arrow feature tables'},
    {label: 'Operations', value: 'Bounds, predicates, projection, limits, and cancellation'}
  ]}
/>

![flatgeobuf-logo](./images/flatgeobuf-logo.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  <img src="https://img.shields.io/badge/arrow_output-From_v5.0-blue.svg?style=flat-square" alt="arrow output from v5.0" />
  <img src="https://img.shields.io/badge/source_loader-From_v5.0-blue.svg?style=flat-square" alt="source loader from v5.0" />
</p>

The `@loaders.gl/flatgeobuf` module handles the [FlatGeobuf](http://flatgeobuf.org/) format, a binary FlatBuffers-encoded format that defines geospatial geometries.

<ReferenceBoundary
  title="FlatGeobuf module details"
  description="The sections below cover installation, loader and source APIs, spatial filtering, Arrow output, and attribution."
  tone="orange"
/>

## Installation

```bash
npm install @loaders.gl/flatgeobuf
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader / Source | Description |
| --------------- | ----------- |
| [`FlatGeobufLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader) | Loads FlatGeobuf files as geospatial tables. |
| [`FlatGeobufSourceLoader`](/docs/modules/flatgeobuf/api-reference/flatgeobuf-source-loader) <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" /> | Streams features and spatially filtered data from FlatGeobuf sources. |

## Attribution

The `FlatGeobufLoader` forks the [`flatgeobuf`](https://github.com/bjornharrtell/flatgeobuf) NPM module under the BSD 2-Clause license.
