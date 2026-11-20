<!-- -->

<!-- -->

images format

# OpenEXR — named HDR channel planes

Keep HDR samples, channel names, and image windows intact.

[images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)

Format feature card

## Read OpenEXR as data.

Unit channel sampling; no color or display conversion

01

Input

Version 2 single-part scanlines; NONE/RLE/ZIPS/ZIP

02

Output

EXRImage with Uint32 or Float32 channel planes

03

Loader

EXRLoader · @loaders.gl/images

04

Parser

@loaders.gl/images/exr

:::note Availability

This page documents the initial implementation in [PR #4415](https://github.com/visgl/loaders.gl/pull/4415). Use a version containing that change; this guide does not imply availability in older published versions.

:::

Detailed guide

## Format, usage and output reference

Understand the source data, load it through the public entry point, and check the supported subset before integrating it.

## What is OpenEXR?[​](#what-is-openexr "Direct link to What is OpenEXR?")

OpenEXR stores high-dynamic-range images and arbitrary named image channels. In addition to color and alpha, a file can hold depth or other numeric passes. HALF, FLOAT, and UINT channels have different numerical meanings; a channel called R is not a request to tone-map the image.

The data window identifies the inclusive pixel rectangle containing samples. The display window describes the intended image frame. Their origins and extents can differ, so width and height alone do not establish where the image belongs in a larger frame.

## Load and select channels explicitly[​](#load-and-select-channels-explicitly "Direct link to Load and select channels explicitly")

```
import {load} from '@loaders.gl/core';

import {EXRLoader} from '@loaders.gl/images';



const image = await load('render.exr', EXRLoader);

const red = image.channels.find(channel => channel.name === 'R');

console.log(image.dataWindow, red?.pixelType, red?.data);
```

No channel is assumed to be RGB. Decide which channels to combine, which color space to use, how to handle non-finite samples, and how to display HDR values in application code.

## Output contract[​](#output-contract "Direct link to Output contract")

| Field                         | Meaning                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `width`, `height`             | Data-window dimensions                                        |
| `dataWindow`, `displayWindow` | Inclusive \[minimum X, minimum Y, maximum X, maximum Y]       |
| `channels`                    | Named planes in file channel order                            |
| `channel.pixelType`           | Original `uint`, `half`, or `float` storage                   |
| `channel.data`                | Uint32Array for UINT; Float32Array for HALF/FLOAT             |
| `channel.perceptuallyLinear`  | Authored channel hint, not an applied transfer function       |
| `compression`                 | `none`, `rle`, `zips`, or `zip`                               |
| `attributes`                  | Raw header attributes with their type names and byte payloads |

Each channel is row-major in increasing data-window Y order. The sample at world pixel (x, y) has index `(y - dataWindow[1]) * width + x - dataWindow[0]`. HALF expands exactly to float32. Negative values, values above one, infinities, and NaNs in binary samples remain available. Chromaticities remain raw header data; they are not automatically applied.

## Supported features and limits[​](#supported-features-and-limits "Direct link to Supported features and limits")

| Supported                               | Unsupported                                                    |
| --------------------------------------- | -------------------------------------------------------------- |
| Version 2, one part, scanline storage   | Tiled, multipart and deep images                               |
| NONE, RLE, one-line ZIPS and block ZIP  | PIZ, PXR24, B44/B44A, DWAA/DWAB                                |
| UINT, HALF and FLOAT, unit X/Y sampling | Subsampled channels                                            |
| Named planes and authored windows       | Tone mapping, exposure, RGB packing, alpha conversion, writing |

Decoded planes are limited to 256 MiB. Missing, duplicate, truncated, and out-of-range scanline chunks reject rather than producing a partially initialized image.

## Loader API and runtime[​](#loader-api-and-runtime "Direct link to Loader API and runtime")

Use the metadata loader with async core APIs. Direct parsing uses `EXRLoaderWithParser` from `@loaders.gl/images/exr`; parsing is asynchronous even for uncompressed inputs. There are no format-specific options. ZIP/ZIPS use the runtime's native `DecompressionStream` zlib support. No new package codec or renderer dependency is added.

For a simpler RGB environment-map format, compare [Radiance HDR](https://loaders.gl/next/docs/modules/images/textures/formats/hdr.md). OpenEXR's named planes and windows require a more explicit application mapping than a bitmap image.
