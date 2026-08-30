---
title: SPLAT, KSPLAT, SPZ, and RAD
description: Compare the binary Gaussian splat containers supported by loaders.gl.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Gaussian splat formats"
  title="Several containers. One renderer-facing table."
  description="SPLAT, KSPLAT, SPZ, and RAD store Gaussian splats with different tradeoffs in headers, compression, and paging. loaders.gl brings them into a shared Mesh Arrow table shape."
  tone="violet"
  meta={['SPLAT', 'KSPLAT', 'SPZ', 'RAD']}
  links={[
    {label: 'Splats module', to: '/docs/modules/splats'},
    {label: 'SPLATLoader', to: '/docs/modules/splats/api-reference/splat-loader'},
    {label: 'RAD source', to: '/docs/modules/splats/api-reference/rad-source-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The format family"
  title="Choose the container for the access pattern."
  description="Raw files are simple and portable; optimized containers add compression or paging. The output contract can remain the same even when the storage strategy changes."
  tone="violet"
  items={[
    {label: 'SPLAT', value: 'Simple fixed-width records for complete files'},
    {label: 'KSPLAT', value: 'Sectioned GaussianSplats3D container'},
    {label: 'SPZ', value: 'Compressed independent attribute streams'},
    {label: 'RAD', value: 'Paged level-of-detail chunks for remote scenes'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`@loaders.gl/splats` supports binary Gaussian splat formats used by web Gaussian splatting viewers.

<ReferenceBoundary
  title="Container and attribute details"
  description="The reference below covers record layouts, headers, compression, paging, version support, and the common Mesh Arrow output."
  tone="violet"
/>

- _[`@loaders.gl/splats`](/docs/modules/splats)_
- _[Spark loading splats documentation](https://sparkjs.dev/docs/loading-splats/)_
- _[GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D)_

## SPLAT

`.splat` is a raw fixed-width binary format. Each splat is stored in 32 bytes:

| Bytes | Type      | Description                         |
| ----- | --------- | ----------------------------------- |
| 0-11  | `float32` | Position, x/y/z                     |
| 12-23 | `float32` | Scale, x/y/z                        |
| 24-27 | `uint8`   | Color, r/g/b/a                      |
| 28-31 | `uint8`   | Quaternion rotation, w/x/y/z bytes |

The format has no header, so loader selection depends on the file extension or explicitly passing `SPLATLoader`.

## KSPLAT

`.ksplat` is the optimized GaussianSplats3D `SplatBuffer` container. It stores a fixed-size global header, section headers, optional bucket metadata, and section splat records.

The v1 loader supports complete in-memory `.ksplat` files and decodes compression levels 0, 1, and 2. Progressive section loading is intentionally not part of the initial API.

## SPZ

`.spz` is Niantic Spatial's compressed 3D Gaussian splat interchange format. SPZ version 4 stores a 32-byte plaintext header, optional extension records, a table of contents, and independent ZSTD-compressed attribute streams for positions, alphas, colors, scales, rotations, and spherical harmonics.

`SPZLoader` decodes complete in-memory SPZ version 4 files into the same Mesh Arrow table shape as `SPLATLoader` and `KSPLATLoader`, preserving SPZ header fields and extension bytes in `loaderData` where practical.

Legacy SPZ versions 1 through 3 use a gzip-compressed single-stream layout and are not supported by `SPZLoader`.

See the [SPZLoader](/docs/modules/splats/api-reference/spz-loader) API reference for usage and ZSTD module requirements.

## RAD

`.rad` is Spark's paged level-of-detail Gaussian splat container. A RAD file starts
with the `RAD0` magic value, a JSON metadata block, and then either inline RADC
chunks or chunk table entries that point to sidecar `.radc` files.

`RADLoader` parses the top-level RAD metadata from a full buffer. `RADSourceLoader`
is the preferred entry point for applications because it can range-fetch the
header, expose the chunk table, and fetch inline or sidecar RADC chunk bytes on
demand.

`RADSourceLoader` can also decode individual RADC chunks into the same Gaussian
splat Mesh Arrow table shape used by the full-buffer loaders. RAD remains a paged
LoD format, so large scenes should still be rendered with chunk paging, LoD tree
traversal, and GPU residency management instead of eagerly decoding every chunk.

See the [RADSourceLoader](/docs/modules/splats/api-reference/rad-source-loader)
API reference for usage.

## Output

`SPLATLoader`, `KSPLATLoader`, and `SPZLoader` return a
[Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) with
Gaussian splat metadata:

- `POSITION`
- `f_dc_0`, `f_dc_1`, `f_dc_2`
- `opacity`
- `scale_0`, `scale_1`, `scale_2`
- `rot_0`, `rot_1`, `rot_2`, `rot_3`
- `f_rest_*` when spherical harmonics are present

The schema metadata includes `loaders_gl.semantic_type = gaussian-splats`.
