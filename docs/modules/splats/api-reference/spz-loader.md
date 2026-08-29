---
title: SPZLoader
description: Parse compressed Niantic Spatial SPZ Gaussian splat files into Mesh Arrow tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="SPZ loader"
  title="Decode compressed splats without changing the application shape."
  description="`SPZLoader` reads Niantic Spatial SPZ files, handles their compressed attribute streams, and returns the same Mesh Arrow table shape as the other loaders.gl Gaussian splat formats."
  tone="violet"
  meta={['SPZ v4', 'ZSTD streams', 'Mesh Arrow table']}
  links={[
    {label: 'Splats module', to: '/docs/modules/splats'},
    {label: 'Splat formats', to: '/docs/modules/splats/formats/splats'},
    {label: 'Mesh category', to: '/docs/specifications/category-mesh'}
  ]}
/>

<DocOrientation
  eyebrow="The SPZ path"
  title="Probe the file. Decompress its streams. Return typed splat columns."
  description="SPZ keeps the file small by compressing independent attribute streams. The loader hides that storage detail while preserving the decoded fields and format metadata needed by applications."
  tone="violet"
  items={[
    {label: 'Input', value: 'SPZ v4 binary data with `NGSP` magic'},
    {label: 'Codec', value: 'Native probe or injected ZSTD implementation'},
    {label: 'Decode', value: 'Positions, color, opacity, scale, rotation, and SH'},
    {label: 'Output', value: 'Mesh Arrow table plus SPZ loader metadata'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`SPZLoader` parses Niantic Spatial `.spz` Gaussian splat files and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

<ReferenceBoundary
  title="Compression and output details"
  description="The reference below covers runtime codec selection, supported SPZ versions, decoded fields, metadata, and loader options."
  tone="violet"
/>

| Property     | Value                                      |
| ------------ | ------------------------------------------ |
| File format  | [SPZ](/docs/modules/splats/formats/splats) |
| Extensions   | `.spz`                                     |
| Worker       | No                                         |
| Input type   | `ArrayBuffer`                              |
| Output shape | `arrow-table`                              |

## Usage

SPZ version 4 uses ZSTD-compressed attribute streams. Async SPZ parsing first probes the lightweight
native decompression entrypoint, which has no codec imports, before lazily loading the
codec-backed fallback. Native Zstandard support is not yet widely available, so inject
`zstd-codec` through loader options for broad runtime compatibility; when provided, it takes
precedence over the native path.
<img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

```typescript
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

```typescript
import {SPZLoaderWithParser} from '@loaders.gl/splats/spz-loader';
```

## Format support

`SPZLoader` supports SPZ version 4 files that start with the `NGSP` magic value and use the plaintext 32-byte header, table of contents, and independent ZSTD-compressed attribute streams.

The loader decodes:

- 24-bit fixed-point positions
- 8-bit alpha values into linear opacity
- 8-bit color values into SH DC coefficients
- 8-bit log-encoded scales into linear scale standard deviations
- smallest-three quaternion rotations into `rot_0`, `rot_1`, `rot_2`, `rot_3`
- 8-bit spherical harmonic rest coefficients for SPZ degrees 1 through 4

Legacy SPZ versions 1 through 3 use a gzip-compressed single-stream layout and are not supported.

## Output

The loader returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) with the existing Gaussian splat columns:

- `POSITION`
- `f_dc_0`, `f_dc_1`, `f_dc_2`
- `opacity`
- `scale_0`, `scale_1`, `scale_2`
- `rot_0`, `rot_1`, `rot_2`, `rot_3`
- `f_rest_*` when spherical harmonics are present

Schema metadata includes `loaders_gl.semantic_type = gaussian-splats` and `loaders_gl.gaussian_splats.source_format = spz`.

`loaderData` includes the SPZ header fields, `antialiased`, `extensionByteLength`, and `extensionBytes` when plaintext extension records are present.

## Options

| Option         | Type            | Default         | Description                              |
| -------------- | --------------- | --------------- | ---------------------------------------- |
| `splats.shape` | `'arrow-table'` | `'arrow-table'` | Selects Mesh Arrow table output. V1 only supports `arrow-table`. |
| `modules`      | `object`        | `{}`            | Include `{'zstd-codec': ZstdCodec}` for broad SPZ version 4 runtime compatibility. |
