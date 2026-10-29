SPZ loader

# Decode compressed splats without changing the application shape.

`SPZLoader` reads Niantic Spatial SPZ files, handles their compressed attribute streams, and returns the same Mesh Arrow table shape as the other loaders.gl Gaussian splat formats.

[Splats module](https://loaders.gl/next/docs/modules/splats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/splats.md)[Splat formats](https://loaders.gl/next/docs/modules/splats/formats/splats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/splats/formats/splats.md)[Mesh category](https://loaders.gl/next/docs/specifications/category-mesh.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

The SPZ path

## Probe the file. Decompress its streams. Return typed splat columns.

SPZ keeps the file small by compressing independent attribute streams. The loader hides that storage detail while preserving the decoded fields and format metadata needed by applications.

01

Input

SPZ v4 binary data with \`NGSP\` magic

02

Codec

Native probe or injected ZSTD implementation

03

Decode

Positions, color, opacity, scale, rotation, and SH

04

Output

Mesh Arrow table plus SPZ loader metadata

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`SPZLoader` parses Niantic Spatial `.spz` Gaussian splat files and returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables).

Detailed guide

## Compression and output details

The reference below covers runtime codec selection, supported SPZ versions, decoded fields, metadata, and loader options.

| Property     | Value                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| File format  | [SPZ](https://loaders.gl/next/docs/modules/splats/formats/splats.md) |
| Extensions   | `.spz`                                                                    |
| Worker       | ❌ No                                                                     |
| Input type   | `ArrayBuffer`                                                             |
| Output shape | `arrow-table`                                                             |

## Usage[​](#usage "Direct link to Usage")

SPZ version 4 uses ZSTD-compressed attribute streams. Async SPZ parsing first probes the lightweight native decompression entrypoint, which has no codec imports, before lazily loading the codec-backed fallback. Native Zstandard support is not yet widely available, so inject `zstd-codec` through loader options for broad runtime compatibility; when provided, it takes precedence over the native path.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

```
// Install zstd-codec for broad runtime compatibility.

// npm install @loaders.gl/core @loaders.gl/splats zstd-codec



import {load} from '@loaders.gl/core';

import {SPZLoader} from '@loaders.gl/splats';

import {ZstdCodec} from 'zstd-codec';



const table = await load(url, SPZLoader, {

  modules: {'zstd-codec': ZstdCodec}

});
```

The parser-bearing subpath can also be imported directly:

```
import {SPZLoaderWithParser} from '@loaders.gl/splats/spz-loader';
```

## Format support[​](#format-support "Direct link to Format support")

`SPZLoader` supports SPZ version 4 files that start with the `NGSP` magic value and use the plaintext 32-byte header, table of contents, and independent ZSTD-compressed attribute streams.

The loader decodes:

* 24-bit fixed-point positions
* 8-bit alpha values into linear opacity
* 8-bit color values into SH DC coefficients
* 8-bit log-encoded scales into linear scale standard deviations
* smallest-three quaternion rotations into `rot_0`, `rot_1`, `rot_2`, `rot_3`
* 8-bit spherical harmonic rest coefficients for SPZ degrees 1 through 4

Legacy SPZ versions 1 through 3 use a gzip-compressed single-stream layout and are not supported.

## Output[​](#output "Direct link to Output")

The loader returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) with the existing Gaussian splat columns:

* `POSITION`
* `f_dc_0`, `f_dc_1`, `f_dc_2`
* `opacity`
* `scale_0`, `scale_1`, `scale_2`
* `rot_0`, `rot_1`, `rot_2`, `rot_3`
* `f_rest_*` when spherical harmonics are present

Schema metadata includes `loaders_gl.semantic_type = gaussian-splats` and `loaders_gl.gaussian_splats.source_format = spz`.

`loaderData` includes the SPZ header fields, `antialiased`, `extensionByteLength`, and `extensionBytes` when plaintext extension records are present.

## Options[​](#options "Direct link to Options")

| Option         | Type            | Default         | Description                                                                        |
| -------------- | --------------- | --------------- | ---------------------------------------------------------------------------------- |
| `splats.shape` | `'arrow-table'` | `'arrow-table'` | Selects Mesh Arrow table output. V1 only supports `arrow-table`.                   |
| `modules`      | `object`        | `{}`            | Include `{'zstd-codec': ZstdCodec}` for broad SPZ version 4 runtime compatibility. |
