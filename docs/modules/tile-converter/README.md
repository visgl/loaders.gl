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
  meta={['I3S ↔ 3D Tiles', 'CLI and API', 'Esri contributed']}
  links={[
    {label: 'I3S converter', to: '/docs/modules/tile-converter/api-reference/i3s-converter'},
    {label: '3D Tiles converter', to: '/docs/modules/tile-converter/api-reference/3d-tiles-converter'},
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

Note: the command line tools are implemented using this API and offer the same functions.

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
