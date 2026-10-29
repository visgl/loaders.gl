LERC module

# Decode compact raster values with bounded error.

`@loaders.gl/raster/lerc` exposes LERC decoding for raster and imagery pipelines. It keeps the compressed payload at the edge and returns typed numeric data for the application or a higher-level loader.

[LERC loader](https://loaders.gl/next/docs/modules/raster/lerc/api-reference/lerc-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/lerc/api-reference/lerc-loader.md)[LERC format](https://loaders.gl/next/docs/modules/raster/lerc/formats/lerc.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/raster/lerc/formats/lerc.md)[Image and raster data](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)

The LERC path

## Read compressed raster data. Return typed values.

LERC is commonly used inside geospatial imagery workflows. The module provides the codec boundary while image and service loaders handle the surrounding metadata and transport.

01

Input

LERC-compressed raster payload

02

Decoder

WASM-backed LERC implementation

03

Output

Typed raster values and dimensions

04

Consumers

Image, GeoTIFF, and service pipelines

Detailed guide

## Codec details

The reference below covers installation, the loader API, the LERC format, WASM delivery, and integration with raster workflows.

![From-v4.0](https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square)

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/raster lerc
```

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {LERCLoader} from '@loaders.gl/raster';



const raster = await load('raster.lerc', LERCLoader);
```

See the [loader reference](https://loaders.gl/next/docs/modules/raster/lerc/api-reference/lerc-loader.md) for decoded bands, masks, statistics, and options. LERC output contains numeric raster values; the application chooses how to visualize them.

The `lerc` decoder is an optional peer dependency. See the [raster package](https://loaders.gl/next/docs/modules/raster.md) for parser entry points and source constructors.
