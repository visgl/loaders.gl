KSPLAT loader

# Bring KSPLAT data into the common splat pipeline.

`KSPLATLoader` parses GaussianSplats3D `.ksplat` files and maps their packed Gaussian attributes into the Mesh Arrow table shape used by loaders.gl applications.

[Splats module](https://loaders.gl/next/docs/modules/splats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/splats.md)[Splat formats](https://loaders.gl/next/docs/modules/splats/formats/splats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/splats/formats/splats.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

The KSPLAT path

## Decode a viewer-oriented file into renderer-oriented columns.

The loader owns the KSPLAT record layout and exposes a stable table interface, so downstream code can share transforms and rendering adapters with other splat formats.

01

Input

Complete \`.ksplat\` binary file

02

Decode

Packed Gaussian positions and attributes

03

Shape

Mesh Arrow table with splat metadata

04

Limit

Complete in-memory files; no progressive sections

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`KSPLATLoader` parses GaussianSplats3D `.ksplat` files and returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables).

Detailed guide

## KSPLAT layout and output details

The reference below covers the supported file shape, decoded columns, output metadata, and options.

| Property     | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| File format  | [KSPLAT](https://loaders.gl/next/docs/modules/splats/formats/splats.md) |
| Extensions   | `.ksplat`                                                                    |
| Worker       | ❌ No                                                                        |
| Input type   | `ArrayBuffer`                                                                |
| Output shape | `arrow-table`                                                                |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {KSPLATLoader} from '@loaders.gl/splats';



const table = await load(url, KSPLATLoader);
```

The loader decodes complete in-memory files. It does not expose GaussianSplats3D's progressive section loading API.

## Options[​](#options "Direct link to Options")

| Option         | Type            | Default         | Description                                                      |
| -------------- | --------------- | --------------- | ---------------------------------------------------------------- |
| `splats.shape` | `'arrow-table'` | `'arrow-table'` | Selects Mesh Arrow table output. V1 only supports `arrow-table`. |
