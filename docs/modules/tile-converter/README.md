---
title: Tile converter
description: Convert between I3S and 3D Tiles datasets with CLI and JavaScript APIs.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tile converter"
  title="Move tiled datasets between compatible standards."
  description="`@loaders.gl/tile-converter` provides command-line and JavaScript tools for converting I3S and 3D Tiles data. Use the APIs when conversion is part of an application, or the CLI when it belongs in a build or data-preparation workflow."
  tone="orange"
  meta={['I3S ↔ 3D Tiles', 'CLI, API and browser', 'Esri contributed']}
  links={[
    {label: 'I3S converter', to: '/docs/modules/tile-converter/api-reference/i3s-converter'},
    {label: '3D Tiles converter', to: '/docs/modules/tile-converter/api-reference/3d-tiles-converter'},
    {label: 'Experimental v5 core', to: '/docs/modules/tile-converter/api-reference/v5-conversion'},
    {label: 'Conversion support', to: '/docs/modules/tile-converter/cli-reference/supported-features'},
    {label: 'Build instructions', to: '/docs/modules/tile-converter/api-reference/build-instructions'}
  ]}
/>

<DocOrientation
  eyebrow="The conversion path"
  title="Read one tiled standard. Write the other."
  description="The converter uses the loaders.gl format implementations at the edges and keeps conversion concerns in one place, whether it runs from a Node.js API or a command-line bundle."
  tone="orange"
  items={[
    {label: 'Input', value: 'I3S or 3D Tiles dataset'},
    {label: 'Conversion', value: 'Format-aware hierarchy and content translation'},
    {label: 'Execution', value: 'JavaScript API or command line'},
    {label: 'Output', value: 'The target tiled standard and its resources'}
  ]}
/>

<ReferenceBoundary
  title="Conversion and CLI details"
  description="The reference below covers installation, converter APIs, build and bundle instructions, CLI usage, supported features, and format standards."
  tone="orange"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

![logo](./images/3d-tiles-small.png)

## Installation

For CLI

```bash
npm install @loaders.gl/tile-converter
```

For API

```bash
npm install @loaders.gl/core
npm install @loaders.gl/tile-converter
```

## Command Line Utilities

`tile-converter` - the npx tool for launch conversion

## API

A JavaScript API is also available:

- `I3SConverter` class that converts 3DTiles to I3S
- `Tiles3DConverter` class that converts I3S to 3DTiles
- The experimental [`/v5/core` and `/v5/adapters` APIs](/docs/modules/tile-converter/api-reference/v5-conversion) for portable mesh/point conversion, explicit feature mapping and archive output.

The command-line tools use the legacy converter classes. V5 CLI integration remains planned.

### Runtime portability

The legacy converters, command-line tools and HTTP server require Node.js. Their filesystem,
service and texture-atlas operations remain separate from the experimental v5 conversion APIs.
V5 core and adapters use portable binary data and run in Chromium and Node.js with
application-provided input readers, output sinks and decoder assets.

## Conversion support

The [supported-feature matrix](/docs/modules/tile-converter/cli-reference/supported-features)
distinguishes the legacy CLI from experimental v5 profiles. V5 converts selected static
GLB/B3DM meshes or original-coordinate I3S `3DObject`/`IntegratedMesh` meshes into authored
I3S/SLPK or 3D Tiles/3TZ resources. It preserves supported materials, one PNG/JPEG base-color
map and explicitly mapped Arrow features, with Draco Edge Breaker enabled by default.
Selected decoded points can also be written as PNTS and partial 3TZ collections through the API.

The [browser archive example](/examples/i3s-slpk) accepts a 3D Tiles URL, an I3S layer URL,
or a local SLPK file and converts selected meshes to either SLPK or 3TZ. It provides metadata
inspection, explicit selection, progress, cancellation, download/preview and native file saving
where supported. Its limits are 1,000 inspected declarations/nodes, 64 mesh placements,
16 MiB input and decoded-resource budgets, 32 MiB output/archive budgets and 1 cm position
rounding. Local SLPK files must be at most 16 MiB. These limits do not bound total peak memory.

Outputs are flat partial collections; source LOD/refinement is not preserved. Feature schemas
and CRS/height operations must be declared explicitly. I3S-to-3TZ conversion requires a
conservative geometric error in meters. Remote SLPK and 3TZ conversion input are not wired
into the controls, although the viewer loads both archive formats locally or remotely.
See the [v5 API guide](/docs/modules/tile-converter/api-reference/v5-conversion) for exact profiles.

### Archive output and storage

`createTileConversionArchive` packages successfully finalized format resources as indexed
SLPK or 3TZ Blobs. Selecting a container does not convert its geometry or metadata.

For application-owned storage, `encodeTileConversionArchiveInBatches` streams finalized SLPK/3TZ
resources with consumer-controlled backpressure and cancellation. Finalize storage only after
iteration succeeds and discard partial output on failure. The browser archive example transfers
acknowledged archive chunks from its worker. It can retain Blob parts for download/preview or,
where the native save picker is available, await each file write before requesting the next chunk.
Direct saving collects no archive Blob parts and commits the file only after successful completion;
cancellation before final close aborts the file stream. Neither mode creates a complete archive
buffer in the worker or guarantees a total memory cap. See the [v5 application guide](https://github.com/visgl/loaders.gl/tree/master/apps/tile-converter#stream-an-archive-to-storage).

## References

- The `@loaders.gl/i3s` module supports loading and traversing Indexed 3d Scene Layer (I3S).
- The `@loaders.gl/3d-tiles` module supports loading and traversing 3D Tiles.

- [I3S Indexed Scene Layer Specification](https://github.com/Esri/i3s-spec) - The living specification.
- [3D Tiles Specification](https://github.com/AnalyticalGraphicsInc/3d-tiles) - The living specification.
- [OGC I3S Indexed Scene Layer Standard](http://www.ogc.org/standards/i3s) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.
- [OGC 3D Tiles Standard](https://www.opengeospatial.org/standards/3DTiles) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.

## Additional build instructions

There are additional ways to perform conversion:

- Tile converter can be run right on a repository branch. It might be helpful if some updates are needed which last release doesn't contain [Build instructions](/docs/modules/tile-converter/api-reference/build-instructions).
- An autonomous bundle script can be built. It is entire converter in just 1 file. This file can be destributed directly to interested but not experienced user. [See instructions](/docs/modules/tile-converter/api-reference/tile-converter-bundle).

## Attribution

The tile-converter module represents a major development effort and was funded and contributed to loaders.gl by Esri.

![logo](./images/esri.jpeg)

MIT License.
