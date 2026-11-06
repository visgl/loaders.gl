---
title: "OpenEXR — named HDR channel planes"
description: "Keep HDR samples, channel names, and image windows intact."
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}
{/* Copyright (c) vis.gl contributors */}

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="images format"
  title="OpenEXR — named HDR channel planes"
  description="Keep HDR samples, channel names, and image windows intact."
  tone="pink"
  meta={["EXRLoader","Renderer-independent output","Explicit initial scope"]}
  links={[{label: 'images module', to: '/docs/modules/images'}]}
/>

<DocOrientation
  eyebrow="Format feature card"
  title="Read OpenEXR as data."
  description="Unit channel sampling; no color or display conversion"
  tone="pink"
  items={[{"label":"Input","value":"Version 2 single-part scanlines; NONE/RLE/ZIPS/ZIP"},{"label":"Output","value":"EXRImage with Uint32 or Float32 channel planes"},{"label":"Loader","value":"EXRLoader · @loaders.gl/images"},{"label":"Parser","value":"@loaders.gl/images/exr-loader"}]}
/>

:::note Availability

This page documents the initial implementation in [PR #4415](https://github.com/visgl/loaders.gl/pull/4415). Use a version containing that change; this guide does not imply availability in older published versions.

:::

<ReferenceBoundary
  title="Format, usage and output reference"
  description="Understand the source data, load it through the public entry point, and check the supported subset before integrating it."
  tone="pink"
/>

## What is OpenEXR?

OpenEXR stores high-dynamic-range images and arbitrary named image channels. In addition to color and alpha, a file can hold depth or other numeric passes. HALF, FLOAT, and UINT channels have different numerical meanings; a channel called R is not a request to tone-map the image.

The data window identifies the inclusive pixel rectangle containing samples. The display window describes the intended image frame. Their origins and extents can differ, so width and height alone do not establish where the image belongs in a larger frame.

## Load and select channels explicitly

```typescript
import {load} from '@loaders.gl/core';
import {EXRLoader} from '@loaders.gl/images';

const image = await load('render.exr', EXRLoader);
const red = image.channels.find(channel => channel.name === 'R');
console.log(image.dataWindow, red?.pixelType, red?.data);
```

No channel is assumed to be RGB. Decide which channels to combine, which color space to use, how to handle non-finite samples, and how to display HDR values in application code.

## Output contract

| Field | Meaning |
| --- | --- |
| `width`, `height` | Data-window dimensions |
| `dataWindow`, `displayWindow` | Inclusive [minimum X, minimum Y, maximum X, maximum Y] |
| `channels` | Named planes in file channel order |
| `channel.pixelType` | Original `uint`, `half`, or `float` storage |
| `channel.data` | Uint32Array for UINT; Float32Array for HALF/FLOAT |
| `channel.perceptuallyLinear` | Authored channel hint, not an applied transfer function |
| `compression` | `none`, `rle`, `zips`, or `zip` |
| `attributes` | Raw header attributes with their type names and byte payloads |

Each channel is row-major in increasing data-window Y order. The sample at world pixel (x, y) has index `(y - dataWindow[1]) * width + x - dataWindow[0]`. HALF expands exactly to float32. Negative values, values above one, infinities, and NaNs in binary samples remain available. Chromaticities remain raw header data; they are not automatically applied.

## Supported features and limits

| Supported | Unsupported |
| --- | --- |
| Version 2, one part, scanline storage | Tiled, multipart and deep images |
| NONE, RLE, one-line ZIPS and block ZIP | PIZ, PXR24, B44/B44A, DWAA/DWAB |
| UINT, HALF and FLOAT, unit X/Y sampling | Subsampled channels |
| Named planes and authored windows | Tone mapping, exposure, RGB packing, alpha conversion, writing |

Decoded planes are limited to 256 MiB. Missing, duplicate, truncated, and out-of-range scanline chunks reject rather than producing a partially initialized image.

## Loader API and runtime

Use the metadata loader with async core APIs. Direct parsing uses `EXRLoaderWithParser` from `@loaders.gl/images/exr-loader`; parsing is asynchronous even for uncompressed inputs. There are no format-specific options. ZIP/ZIPS use the runtime's native `DecompressionStream` zlib support. No new package codec or renderer dependency is added.

For a simpler RGB environment-map format, compare [Radiance HDR](../textures/formats/hdr.md). OpenEXR's named planes and windows require a more explicit application mapping than a bitmap image.
