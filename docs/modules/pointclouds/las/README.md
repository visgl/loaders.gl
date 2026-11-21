---
title: '@loaders.gl/pointclouds/las'
description: Read and write LAS and LAZ point clouds with typed records, streaming, and Arrow output.
hide_title: true
page_style: designed
---

import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';
import {PointCloudFormatGraphic} from '@site/src/components/docs/point-cloud-format-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="las"
  eyebrow="Point-cloud module"
  title="@loaders.gl/pointclouds/las"
  description="Keep the point record, or keep the columns. Read and write LAS/LAZ exchange data as raw records, a render-ready point cloud, or a typed Mesh Arrow table."
  tone="blue"
  meta={['LAS 1.0–1.5', 'LAZ point formats 0–10', 'TypeScript reader']}
  links={[
    {label: 'LAS / LAZ format', to: '/docs/modules/pointclouds/las/formats/las'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<LasDocsTabs active="overview" />

<PointCloudFormatGraphic />

<DocOrientation
  eyebrow="The LAS path"
  title="Decode the fields your workflow actually uses."
  description="LAS and LAZ carry more than positions. loaders.gl exposes standard attributes, flags, colors, time, waveform references, and Extra Bytes while allowing applications to choose the output shape."
  tone="blue"
  items={[
    {label: 'Geometry', value: 'Scaled positions with source offsets and bounds'},
    {label: 'Attributes', value: 'Classification, returns, color, time, NIR, and waveform data'},
    {label: 'Columnar path', value: "Use shape: 'arrow' and select columns"},
    {label: 'Write back', value: 'Encode Mesh or Mesh Arrow tables as LAS or LAZ'}
  ]}
/>

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
current LAS/LAZ projection-record support and vertical/compound CRS roadmap.

The `@loaders.gl/pointclouds/las` module supports the [LAS file format](/docs/modules/pointclouds/las/formats/las) and its compressed version (LAZ).

<ReferenceBoundary
  title="LAS implementation details"
  description="The sections below cover installation, loaders and writers, point-record support, and current compatibility limits."
  tone="blue"
/>

`LASLoader` supports LAZ point formats 0-10 for documented LASzip codec combinations. Arrow output exposes positions, intensity, classification, RGB, GPS time, NIR, waveform references, and Extra Bytes where present, while the raw APIs preserve complete supported point records. Waveform helpers range-read internal LAS or external WDP sample packets on demand. See the [LAS/LAZ implementation limits](/docs/modules/pointclouds/las/formats/las#current-implementation-limits) for exact codec, point-format, fixture, and streaming details.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/pointclouds
```

The default TypeScript LAS/LAZ loader does not require the optional `copc` or `laz-perf` npm
packages. They are declared as `optionalDependencies`, so consumers can omit them with
`npm install --omit=optional`. Install `copc` explicitly when using the alternative
`@loaders.gl/pointclouds/las-copc-loader` implementation. The LAZPerf and LAZRs loader paths include their
vendored runtimes.

## Loaders and Writers

| Loader or Writer                                              | Description                                  |
| ------------------------------------------------------------- | -------------------------------------------- |
| [`LASLoader`](/docs/modules/pointclouds/las/api-reference/las-loader)      | Loads LAS/LAZ point clouds as Mesh objects or [Mesh Arrow tables](/docs/specifications/category-mesh#mesh-arrow-tables). |
| [`LASWriter`](/docs/modules/pointclouds/las/api-reference/las-writer)      | Writes Mesh or Mesh Arrow table point clouds as LAS or LAZ data. |

`LASMesh`, `LASHeader`, and `LASMetadata` are available as type-only imports from `@loaders.gl/pointclouds/las`.
Use `LASMesh` when describing the loader's mesh output without importing implementation files.

## Attribution

LASLoader is a fork of Uday Verma and Howard Butler's [plasio](https://github.com/verma/plasio/) under MIT License.

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/pointclouds/THIRD-PARTY-NOTICES.md)
and the project-wide [Attributions and Credits](/docs/references-and-credits).

## Querying LAS and LAZ

`LASLoader` supports `createDataSource()` and the loaders.gl table query API:

```typescript
import {createDataSource} from '@loaders.gl/core';
import {query} from '@loaders.gl/core/query';
import {LASLoader} from '@loaders.gl/pointclouds/las';

const source = await createDataSource('points.laz', LASLoader);
const result = await query({
  select: ['POSITION', {column: 'COLOR_0', as: 'colors'}],
  limit: 10000
}, {source});
```

The source discovers its schema from the LAS header and variable-length records without decoding
point records. Projection selects the decoder's output columns before allocation; predicate
columns remain available until filtering completes. `POSITION` is always decoded internally,
even when it is not selected. The result contains only the requested fields in selection order.

`source.read()` yields native Arrow record batches and supports `columns`, `predicate`, `offset`,
`limit`, and `signal`. Filters run on decoded Arrow data before the global row window. Limits stop
consumption of the input stream. LAS and LAZ remain sequential scans: selecting fewer columns does
not imply fewer network bytes or skipping compressed point records.

`las.fp64` controls position precision during decoding. Cast expressions remain query-engine
operations rather than decoder pushdowns. Casting Float32 positions to Float64 after decoding
cannot recover precision lost during decoding. `core.batchSize` and `core.batchMaxRowsPerSecond`
control batch size and delivery rate.

For synchronous construction, call `await preload(LASLoader)` before
`createDataSourceSync(input, LASLoader)`. `load()` continues to return parsed data.
