# SPLAT, KSPLAT, SPZ, and RAD

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`@loaders.gl/splats` supports binary Gaussian splat formats used by web Gaussian splatting viewers.

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

`.spz` is a compressed 3D Gaussian splat interchange format. Niantic Spatial SPZ version 4 stores a 32-byte plaintext header, optional extension records, a table of contents, and independent ZSTD-compressed attribute streams for positions, alphas, colors, scales, rotations, and spherical harmonics.

`SPZLoader` decodes complete in-memory SPZ version 4 files into the same Mesh Arrow table shape as `SPLATLoader` and `KSPLATLoader`, preserving SPZ header fields and extension bytes in `loaderData` where practical.

Spark legacy SPZ versions 1 through 3 use a gzip-compressed single-stream layout. `SPZLoader` supports that layout as well, including Spark's `0x80` LoD extension with `child_count` and `child_start` arrays preserved in `loaderData`.

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
`RADSplatLayer` from `@loaders.gl/deck-layers` provides the deck.gl/luma.gl RAD
rendering path used by the website example, including viewport-driven LoD
selection and a shared GPU render pool for the active RAD frontier.

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
