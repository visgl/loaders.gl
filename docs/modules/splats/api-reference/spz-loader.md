# SPZLoader Proposal

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Proposal-lightgrey.svg?style=flat-square" alt="Status: Proposal" />
</p>

`SPZLoader` is a proposed loader for Niantic Spatial `.spz` Gaussian splat files. It would complement the existing `SPLATLoader` and `KSPLATLoader` by adding support for a compact interchange format designed for small files, parallel attribute decompression, metadata, and vendor extensions.

| Property     | Proposed value                                      |
| ------------ | --------------------------------------------------- |
| File format  | [SPZ](/docs/modules/splats/formats/splats)          |
| Extensions   | `.spz`                                              |
| Worker       | Yes, if ZSTD/WASM decompression is used             |
| Input type   | `ArrayBuffer`                                       |
| Output shape | `arrow-table`                                       |
| Status       | Proposal, not implemented                           |

## Goals

- Decode SPZ version 4 files into the same Mesh Arrow table shape returned by `SPLATLoader` and `KSPLATLoader`.
- Keep `@loaders.gl/splats` output stable for downstream consumers such as `SplatLayer`.
- Preserve SPZ header values and recognized extension metadata in `loaderData`.
- Leave room for parallel or worker-based decompression without requiring a new output shape.

## Proposed usage

```typescript
import {load} from '@loaders.gl/core';
import {SPZLoader} from '@loaders.gl/splats';

const table = await load(url, SPZLoader);
```

## Proposed format handling

SPZ version 4 files start with the `NGSP` magic value and a 32-byte little-endian header. The proposed loader should parse:

- `version`
- `numPoints`
- `shDegree`
- `fractionalBits`
- `flags`
- `numStreams`
- `tocByteOffset`
- stream compressed and uncompressed sizes from the table of contents
- optional plaintext extension records when the extension flag is set

The loader should then decompress the independent attribute streams and decode:

- 24-bit fixed-point positions
- 8-bit log-encoded scales
- compressed rotations using the smallest-three quaternion representation
- 8-bit alphas
- 8-bit colors
- spherical harmonics for supported degrees

Legacy SPZ versions 1 through 3 use a gzip-compressed single-stream layout. Support for those versions should be considered separately from the first version 4 implementation.

## Proposed output

The loader should return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) with the existing Gaussian splat columns:

- `POSITION`
- `f_dc_0`, `f_dc_1`, `f_dc_2`
- `opacity`
- `scale_0`, `scale_1`, `scale_2`
- `rot_0`, `rot_1`, `rot_2`, `rot_3`
- `f_rest_*` when spherical harmonics are present

Schema metadata should continue to include `loaders_gl.semantic_type = gaussian-splats`, with `loaders_gl.gaussian_splats.source_format = spz`.

## Comparison with current loaders

| Capability       | SPLATLoader                         | KSPLATLoader                                      | Proposed SPZLoader                                      |
| ---------------- | ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Container        | Headerless fixed-width rows         | GaussianSplats3D sectioned buffer                 | Header, extension records, TOC, compressed streams      |
| Compression      | None                                | Compression levels 0, 1, and 2                   | Attribute quantization plus independent ZSTD streams    |
| Loading model    | Full in-memory decode               | Full in-memory decode                             | Full in-memory decode first, worker path preferred      |
| SH support       | DC color only                       | SH degree 0 through 3                             | SPZ degree 0 through 4, subject to Arrow schema support |
| Metadata         | Minimal source metadata             | Header and section metadata                       | Header, stream table, flags, and recognized extensions  |
| Implementation   | Pure TypeScript                     | Pure TypeScript                                   | Requires ZSTD strategy, likely WASM or native fallback  |

## Dependency strategy

SPZ version 4 requires ZSTD decompression. The first implementation should avoid adding a mandatory heavy dependency to applications that only use `SPLATLoader` or `KSPLATLoader`.

Preferred options:

1. Lazy-load a ZSTD implementation from the parser-bearing `SPZLoaderWithParser` entry point.
2. Run decompression in a worker when practical.
3. Keep the root `@loaders.gl/splats` import metadata-only, following the existing loader split.

## Open questions

- Which ZSTD implementation should be used in browser and Node.js environments?
- Should legacy gzip SPZ versions 1 through 3 be supported in the first implementation?
- How should unrecognized SPZ extension records be exposed in `loaderData`?
- Should SPZ degree 4 spherical harmonics add 72 `f_rest_*` columns immediately, or should the shared Gaussian splat schema first document degree 4 explicitly?
- Should coordinate-system conversion be exposed as a loader option, or should the first implementation preserve SPZ coordinates as stored?

