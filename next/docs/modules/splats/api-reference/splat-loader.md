Gaussian splat loader

# Turn splat points into a common table.

`SPLATLoader` reads the compact `.splat` representation used by Gaussian splat viewers and returns the Mesh Arrow table shape used by loaders.gl applications and rendering layers.

[Splats module](https://loaders.gl/next/docs/modules/splats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/splats.md)[Splat formats](https://loaders.gl/next/docs/modules/splats/formats/splats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/splats/formats/splats.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

The splat path

## Read packed attributes. Preserve the renderer-facing columns.

The loader converts position, color, opacity, scale, and rotation attributes into typed columns without requiring applications to understand the binary record layout.

01

Input

Raw \`.splat\` binary data

02

Decode

Positions, colors, opacity, scales, and rotations

03

Shape

Mesh Arrow table with Gaussian splat metadata

04

Next step

Pass the table to a splat renderer or transform

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`SPLATLoader` parses raw `.splat` Gaussian splat files and returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables).

Detailed guide

## Binary layout and output details

The reference below covers supported fields, output columns, options, and the relationship between the compact file and the common Mesh Arrow representation.

| Property     | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| File format  | [SPLAT](https://loaders.gl/next/docs/modules/splats/formats/splats.md) |
| Extensions   | `.splat`                                                                    |
| Worker       | ❌ No                                                                       |
| Input type   | `ArrayBuffer`                                                               |
| Output shape | `arrow-table`                                                               |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {SPLATLoader} from '@loaders.gl/splats';



const table = await load(url, SPLATLoader);
```

The returned table uses GraphDECO-style Gaussian splat columns and can be passed to `SplatLayer`.

## Options[​](#options "Direct link to Options")

| Option         | Type            | Default         | Description                                                      |
| -------------- | --------------- | --------------- | ---------------------------------------------------------------- |
| `splats.shape` | `'arrow-table'` | `'arrow-table'` | Selects Mesh Arrow table output. V1 only supports `arrow-table`. |
