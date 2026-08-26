import {CopcDocsTabs} from '@site/src/components/docs/copc-docs-tabs';

# Overview

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
current COPC/LAS projection-record support and vertical/compound CRS roadmap.

![copc-logo](../../images/logos/copc-logo-80.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square" alt="From-v4.1" />
  <img src="https://img.shields.io/badge/source_loader-From_v5.0-blue.svg?style=flat-square" alt="source loader from v5.0" />
  <img src="https://img.shields.io/badge/source_loader-Work--In--Progress-orange.svg?style=flat-square" alt="source loader work in progress" />
</p>

<CopcDocsTabs active="overview" />

The `@loaders.gl/copc` module loads and writes the [COPC](/docs/modules/copc/formats/copc) format. Its primary reader is TypeScript-only and performs native COPC hierarchy, byte-range, and LAZ point decoding.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/copc
```

## APIs

| API | Description |
| --- | --- |
| [`COPCSourceLoader`](/docs/modules/copc/api-reference/copc-source-loader) <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" /> | Loads viewport-selected point data from COPC files through byte ranges. |
| [`COPCWriter`](/docs/modules/copc/api-reference/copc-writer) | Writes Mesh or Mesh Arrow table point clouds as COPC 1.0 data. |

## Attribution

The original module was based on Connor Manning's [copc.js](https://github.com/connormanning/copc.js/) project under the MIT license. The current primary reader is a first-party TypeScript implementation with no `copc` runtime dependency.
