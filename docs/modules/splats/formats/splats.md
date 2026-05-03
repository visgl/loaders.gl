# SPLAT and KSPLAT

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

## Output

Both loaders return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) with Gaussian splat metadata:

- `POSITION`
- `f_dc_0`, `f_dc_1`, `f_dc_2`
- `opacity`
- `scale_0`, `scale_1`, `scale_2`
- `rot_0`, `rot_1`, `rot_2`, `rot_3`
- `f_rest_*` when spherical harmonics are present

The schema metadata includes `loaders_gl.semantic_type = gaussian-splats`.
