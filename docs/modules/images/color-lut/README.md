---
title: "Color LUTs — Cube, 3dl and PNG"
description: "Read color mappings as numerical tables with explicit domains, precision and image layouts."
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}
{/* Copyright (c) vis.gl contributors */}

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="images format"
  title="Color LUTs — Cube, 3dl and PNG"
  description="Read color mappings as numerical tables with explicit domains, precision and image layouts."
  tone="pink"
  meta={["Cube · 3dl · PNG","Renderer-independent output","Explicit initial scope"]}
  links={[{label: 'images module', to: '/docs/modules/images'}]}
/>

<DocOrientation
  eyebrow="Color LUT feature card"
  title="Three encodings, one numerical table contract."
  description="Choose the source format explicitly; retain domains, grid knots and precision before applying a color transform."
  tone="pink"
  items={[
    {label: 'Cube', value: 'Single 1D or 3D text table with explicit domain bounds'},
    {label: '3dl', value: 'Grid-first integer samples; caller supplies output bit depth'},
    {label: 'PNG', value: 'Opaque 8-bit samples with explicit blue-slice tile layout'},
    {label: 'Output', value: 'Float32 RGB with red input varying fastest'},
    {label: 'Precision', value: 'Float64 input knots and retained source encoding precision'},
    {label: 'Boundary', value: 'Opt-in CPU interpolation; no color-space conversion or GPU objects'}
  ]}
/>

A color lookup table maps input values to output RGB samples. The loaders below
produce a common renderer-independent ColorLUT contract, while retaining each
format's domain, grid, and precision information. Choose a source encoding first;
the opt-in utilities below can interpolate or apply that table without renderer objects.

:::note Availability

These loaders are introduced by [PR #4411](https://github.com/visgl/loaders.gl/pull/4411).
Use a version containing that change.

:::

| Input | Loader | Required format options |
| --- | --- | --- |
| [Cube](#cube-text-tables) | CubeLUTLoader | None |
| [Grid-first 3dl](#grid-first-3dl-tables) | ThreeDLLUTLoader | lut.outputBitDepth |
| [PNG tiling](#png-image-layouts) | ImageLUTLoader | lut.size and lut.tilesPerRow |

## Output contract

| Field | Meaning |
| --- | --- |
| `dimension`, `size` | One or three input dimensions and samples per axis |
| `data` | Interleaved Float32 RGB output samples |
| `domainMinimum`, `domainMaximum` | Input bounds for each channel |
| `title` | Optional authored title |
| `inputGrid` | Optional normalized Float64 input knots for nonuniform grids |
| `sourceInputGrid` | Optional original integer grid knots |
| `sourceOutputBitDepth` | Source precision where explicitly known |

For a 3D table, red input varies fastest, followed by green, then blue. The RGB triple at integer grid coordinates (red, green, blue) starts at `3 * (red + size * (green + size * blue))`. The loader returns table data; applications can choose the CPU interpolation helpers below and their own gamut conversion, transfer functions, tone mapping and GPU upload. Float32 storage can round authored decimal values.



## Cube text tables

### What is a .cube LUT?

A Cube file stores a sampled mapping from input color values to output RGB values. A 1D table defines channel curves; a 3D table samples an RGB input cube. Titles, table size, and optional domain bounds describe how to interpret the sample rows. A LUT is not itself a color-space declaration, a shader, or an image filter implementation.

### Load a table

```typescript
import {load} from '@loaders.gl/core';
import {CubeLUTLoader} from '@loaders.gl/images';

const table = await load('grade.cube', CubeLUTLoader);
console.log(table.dimension, table.size, table.domainMinimum, table.domainMaximum);
```
### Supported features and limits

The loader accepts a single 1D or 3D table with TITLE, DOMAIN_MIN, and DOMAIN_MAX. Defaults are an input domain of zero to one per channel. Output samples are preserved without clamping, so authored values can lie outside that interval. Comments and quoted titles are scanned without an ambiguous backtracking expression.

Combined shaper-plus-3D files, unknown vendor directives, inconsistent dimensions, incomplete tables, non-finite numbers, and invalid domains reject. There is no writer, and loading does not apply the table automatically. Know which color encoding the producer expects before applying the table to an image.

### Direct parsing and related formats

Import `CubeLUTLoaderWithParser` from `@loaders.gl/images/cube-lut-loader` for synchronous core `parseSync`. There are no Cube-specific options. The root loader is metadata-only and async core APIs preload its parser.

Compare [grid-first 3dl](#grid-first-3dl-tables) for integer samples and nonuniform knots, or [PNG image LUTs](#png-image-layouts) for explicit blue-slice tilings. All three produce the same ColorLUT sample ordering.

## Grid-first 3dl tables

### What is a .3dl LUT?

The supported 3dl layout starts with a row of integer input-grid knots followed by integer RGB output rows. Input knots can be nonuniform. Files sharing the .3dl extension can use other vendor headers and conventions, so the extension alone is not a complete interoperability contract.

The first row determines the cube edge size. The supported source rows vary blue fastest; the loader reorders them into the shared red-fastest ColorLUT layout. The input knots and output encoding have separate meanings. An input-grid maximum is not an output-bit-depth declaration.

### Supply the output bit depth

```typescript
import {load} from '@loaders.gl/core';
import {ThreeDLLUTLoader} from '@loaders.gl/images';

const table = await load('grade.3dl', ThreeDLLUTLoader, {
  lut: {outputBitDepth: 12}
});
console.log(table.sourceInputGrid, table.inputGrid, table.sourceOutputBitDepth);
```

Choose the bit depth from the producer's format contract. It is not guessed from the brightest sample. Output channels are normalized by `2 ** outputBitDepth - 1`; original input knots remain in sourceInputGrid, and their normalized coordinates use Float64 storage in inputGrid.

### Supported features and limits

Only grid-first integer files with a complete cubic set of RGB rows are supported. Input knots must be valid and ordered, and output samples must fit the explicit bit depth. Vendor mesh headers, implicit precision guessing, missing output rows, and malformed samples reject. The normalized input domain is zero to one; preserve and use inputGrid when interpolating a nonuniform table.

### Loader options and direct parsing

| Option | Required | Meaning |
| --- | --- | --- |
| `lut.outputBitDepth` | Yes | Integer output-channel encoding precision, 1 through 24; no inferred default |

Import `ThreeDLLUTLoaderWithParser` from `@loaders.gl/images/3dl-lut-loader` for synchronous core parsing, passing the same options. The root export is metadata-only. The parser adds no renderer object or codec dependency; CPU interpolation uses the separate opt-in utilities below.

See [Cube](#cube-text-tables) for text tables with domain directives and [image LUTs](#png-image-layouts) for PNG tilings.

## PNG image layouts

### What is an image LUT?

An image LUT lays out slices of a 3D color cube in a 2D image. Red changes within each tile horizontally, green vertically, and each tile represents a blue slice. A horizontal strip, vertical strip, and rectangular tiling can contain the same mapping with different image dimensions.

A PNG does not identify which layout its producer used or whether it is a LUT at all. Select ImageLUTLoader explicitly and supply the layout rather than relying on generic PNG detection.

### Load an explicitly tiled PNG

```typescript
import {load} from '@loaders.gl/core';
import {ImageLUTLoader} from '@loaders.gl/images';

// A 16-edge cube with 16 blue slices in one horizontal row: 256 × 16 pixels.
const table = await load('grade.png', ImageLUTLoader, {
  lut: {size: 16, tilesPerRow: 16}
});
```

The required dimensions are `width = size * tilesPerRow` and `height = size * (size / tilesPerRow)`. The tile count must divide size exactly, with 1 ≤ tilesPerRow ≤ size and 2 ≤ size ≤ 256. Blue slices advance left to right and then to the next tile row. Pixel row zero is the source's top row; there is no application orientation flip.

Image outputs have dimension 3, a zero-to-one input domain, and sourceOutputBitDepth 8. Each channel is divided by 255. The image is a data container; the loader does not interpret its samples as a photographic image that needs a display transform.

### Precision, metadata and runtime

Only opaque 8-bit samples are supported. Dimensions, cube edge size (at most 256), PNG signature and bit depth are checked before bitmap decoding. The encoded path permits only IHDR, PLTE, IDAT, IEND, tRNS, and sRGB chunks. Other metadata, including ICC profiles, gamma/chromaticity, significant-bit hints, and EXIF orientation, rejects before generic image APIs can rewrite the samples. Transparency rejects after decode.

The parser requests no bitmap color conversion or premultiplication and closes its temporary bitmap. Browser image facilities are required in the browser. Node uses the existing images bitmap/polyfill backend and its optional Sharp peer; this feature adds no dependency, but encoded PNG decoding is not a standalone Node PNG codec. See [Node image codecs](../README.md#node-image-codecs).

High-bit-depth, nonopaque, metadata-bearing, or differently arranged images need a separate data-preserving decoder and the raw-pixel utility below. JPEG is unsuitable for exact LUT samples because it is lossy and is not accepted by this loader.

### Convert already decoded pixels

```typescript
import {parseImageLUT} from '@loaders.gl/images/color-lut';

const table = parseImageLUT(opaqueRgbOrRgbaBytes, width, height, {
  size: 16,
  tilesPerRow: 16
});
```

The utility accepts Uint8Array or Uint8ClampedArray RGB/RGBA samples and validates layout and opacity. The caller is responsible for keeping encoded sample values intact during decoding; decoding with a color profile or alpha premultiplication and then passing those pixels cannot recover the original values.

### Loader API

Both `lut.size` and `lut.tilesPerRow` are required. The metadata export lives at the images root; `ImageLUTLoaderWithParser` lives at `@loaders.gl/images/image-lut-loader`. Encoded parsing is async, not `parseSync`. The raw-pixel utility is synchronous.

Compare [Cube](#cube-text-tables) and [3dl](#grid-first-3dl-tables) when a text LUT carries the mapping more directly.

## CPU sampling and application

The same opt-in `@loaders.gl/images/color-lut` entry point also provides
`createColorLUTSampler` and `applyColorLUT`. Neither imports a renderer or image codec;
loader root imports stay metadata-only and no dependencies are added.

```typescript
import {createColorLUTSampler, applyColorLUT} from '@loaders.gl/images/color-lut';

const sample = createColorLUTSampler(lut);
const rgb = sample(0.25, 0.5, 0.75);
const transformed = applyColorLUT(lut, rgbaFloatPixels, {components: 4});
```

The sampler snapshots the table, domains and optional knots, so subsequent source mutations
do not change its results. It performs independent channel interpolation for 1D tables
and trilinear interpolation for 3D tables, using red-fastest storage. Nonuniform normalized
3dl input knots determine interval selection and weights. Finite input coordinates clamp
to the authored per-channel domain. Outputs retain signed/HDR values without clamping.

These operations apply numerical tables, without implicit sRGB/linear conversion,
byte-to-unit scaling, exposure or gamut mapping. Applications must supply input values
in the LUT's expected domain and color encoding. NaN/infinite inputs and malformed tables,
knots or domains reject. Domain spans must be finite and positive.

`applyColorLUT(lut, colors, options)` accepts interleaved `Float32Array` or `Float64Array`
RGB pixels by default. Set `components: 4` for RGBA. It returns a new `Float32Array`
and preserves the input. Alpha bypasses the LUT and is copied at float32 precision;
nonfinite or unrepresentable alpha rejects. Empty buffers return empty arrays, and
incomplete pixels reject. These are CPU preprocessing helpers, not GPU texture objects
or an automatic image decoding/color-management pipeline.
