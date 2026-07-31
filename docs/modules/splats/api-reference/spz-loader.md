# SPZLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`SPZLoader` parses `.spz` Gaussian splat files and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) by default.

| Property     | Value                                      |
| ------------ | ------------------------------------------ |
| File format  | [SPZ](/docs/modules/splats/formats/splats) |
| Extensions   | `.spz`                                     |
| Worker       | No                                         |
| Input type   | `ArrayBuffer`                              |
| Output shape | `arrow-table`, `gaussian-splats`           |

## Usage

SPZ version 4 uses ZSTD-compressed attribute streams. Inject `zstd-codec` through loader options so applications that only use `SPLATLoader` or `KSPLATLoader` do not pay the ZSTD dependency cost. Spark legacy SPZ versions 1 through 3 use gzip compression and do not require `zstd-codec`.

```typescript
// npm install @loaders.gl/core @loaders.gl/splats zstd-codec

import {load} from '@loaders.gl/core';
import {SPZLoader} from '@loaders.gl/splats';
import {ZstdCodec} from 'zstd-codec';

const table = await load(url, SPZLoader, {
  modules: {'zstd-codec': ZstdCodec}
});
```

The parser-bearing subpath can also be imported directly:

```typescript
import {SPZLoaderWithParser} from '@loaders.gl/splats/spz-loader';
```

## Format support

`SPZLoader` supports Niantic Spatial SPZ version 4 files that start with the `NGSP` magic value and use the plaintext 32-byte header, table of contents, and independent ZSTD-compressed attribute streams.

The loader also supports Spark legacy SPZ versions 1 through 3. These files use a gzip-compressed single-stream layout. When Spark LoD metadata is present through the `0x80` flag, the loader preserves the decoded `childCounts` and `childStarts` arrays in `loaderData` for renderer-side LoD traversal.

The loader decodes:

- 24-bit fixed-point positions
- 8-bit alpha values into linear opacity
- 8-bit color values into SH DC coefficients
- 8-bit log-encoded scales into linear scale standard deviations
- smallest-three quaternion rotations into `rot_0`, `rot_1`, `rot_2`, `rot_3`
- 8-bit spherical harmonic rest coefficients for SPZ degree 1 through 4 in version 4 files
- 8-bit spherical harmonic rest coefficients for SPZ degree 1 through 3 in Spark legacy files
- Spark legacy LoD `child_count` and `child_start` arrays when present

## Output

The loader returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) with the existing Gaussian splat columns by default:

- `POSITION`
- `f_dc_0`, `f_dc_1`, `f_dc_2`
- `opacity`
- `scale_0`, `scale_1`, `scale_2`
- `rot_0`, `rot_1`, `rot_2`, `rot_3`
- `f_rest_*` when spherical harmonics are present

Schema metadata includes `loaders_gl.semantic_type = gaussian-splats` and `loaders_gl.gaussian_splats.source_format = spz`.

`loaderData` includes the SPZ header fields, `antialiased`, `extensionByteLength`, and `extensionBytes` when plaintext SPZ v4 extension records are present. Spark legacy LoD files include `loaderData.lodTree`, `loaderData.childCounts`, and `loaderData.childStarts`.

Set `splats.shape` to `gaussian-splats` to return decoded typed arrays instead of an Arrow table. This is useful for renderer paths that need to bypass Arrow materialization and retain LoD metadata.

## Options

| Option         | Type            | Default         | Description                              |
| -------------- | --------------- | --------------- | ---------------------------------------- |
| `splats.shape` | `'arrow-table' \| 'gaussian-splats'` | `'arrow-table'` | Selects Mesh Arrow table output or decoded Gaussian splat arrays. |
| `modules`      | `object`        | `{}`            | Must include `{'zstd-codec': ZstdCodec}` to decode SPZ version 4 streams. |
