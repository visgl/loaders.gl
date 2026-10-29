Point-based scene data

# Load splats in the format the scene already uses.

The splats module handles several binary Gaussian splat layouts and exposes full-buffer or source-based entry points for rendering, processing, and level-of-detail streaming.

[Splats formats](https://loaders.gl/next/docs/modules/splats/formats/splats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/splats/formats/splats.md)[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

One visual primitive, several files

## Keep the splat data compact until the renderer needs it.

SPLAT, KSPLAT, SPZ, and RAD use different storage and paging conventions. The module keeps those differences at the loader boundary while making the scene data available to applications.

01

Full buffers

Load complete SPLAT, KSPLAT, or SPZ files

02

Paged data

Use RAD source metadata and chunks

03

Output

Gaussian splat attributes for rendering

04

Status

Experimental v5.0 module

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `@loaders.gl/splats` module loads binary Gaussian splat files for rendering, processing, or paged level-of-detail streaming.

Detailed guide

## Splat loaders and formats

The sections below list installation, loader entry points, format families, and the available full-buffer and source paths.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/splats
```

## Loaders[​](#loaders "Direct link to Loaders")

| Loader                                                                                                   | Description                                               |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`SPLATLoader`](https://loaders.gl/next/docs/modules/splats/api-reference/splat-loader.md)          | Loads raw `.splat` Gaussian splat files.                  |
| [`KSPLATLoader`](https://loaders.gl/next/docs/modules/splats/api-reference/ksplat-loader.md)        | Loads GaussianSplats3D `.ksplat` files from full buffers. |
| [`SPZLoader`](https://loaders.gl/next/docs/modules/splats/api-reference/spz-loader.md)              | Loads Niantic Spatial `.spz` files from full buffers.     |
| [`RADLoader`](https://loaders.gl/next/docs/modules/splats/api-reference/rad-source-loader.md)       | Loads Spark `.rad` metadata from full buffers.            |
| [`RADSourceLoader`](https://loaders.gl/next/docs/modules/splats/api-reference/rad-source-loader.md) | Creates a source for Spark `.rad` metadata and chunks.    |

## Formats[​](#formats "Direct link to Formats")

| Format                                                                                           | Description                                         |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| [SPLAT / KSPLAT / SPZ / RAD](https://loaders.gl/next/docs/modules/splats/formats/splats.md) | Binary Gaussian splat formats for real-time scenes. |

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/splats/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
