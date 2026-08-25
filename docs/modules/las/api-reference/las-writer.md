import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LASWriter

<LasDocsTabs active="laswriter" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `LASWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) point cloud data as LAS or LAZ binary data.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {LASWriter} from '@loaders.gl/las';

declare const pointCloud: Mesh | MeshArrowTable;

const arrayBuffer = await encode(pointCloud, LASWriter, {
  las: {
    format: 'laz',
    scale: [0.001, 0.001, 0.001]
  }
});
```

## Data Format

`LASWriter` accepts Mesh Arrow tables and legacy Mesh objects. Arrow table input is normalized to the writer's Mesh representation before LAS binary data is encoded.

The writer requires a `POSITION` attribute. It writes `COLOR_0`, `intensity`, and `classification` attributes when present. It can select LAS versions 1.0-1.4 and PDRF 0-8 for uncompressed output, but fields without a corresponding input attribute, including GPS time, waveform references, NIR, return flags, and scanner metadata, are zero-filled. Current uncompressed round-trip coverage targets default LAS 1.2 and LAS 1.4/PDRF 7; full conformance for every selectable version/PDRF combination is not claimed.

LAZ output uses LAS 1.4, PDRF 6-8, LASzip layered compressor 3, arithmetic coder 0, item version 3, and a fixed-size chunk table. The output is readable by the TypeScript loader and established WASM decoders. COPC output is provided separately by [`COPCWriter`](/docs/modules/copc/api-reference/copc-writer) to keep the LAS and COPC packages acyclic.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `las.format` | LAS or LAZ | `'las'` | Output container. Both LAS and LAZ are implemented. Use `COPCWriter` for COPC output. |
| `las.version` | `'1.0'` through `'1.4'` | `'1.2'` or `'1.4'` | LAS header version. The default is 1.4 for modern PDRFs and 1.2 otherwise. |
| `las.pointDataRecordFormat` | `0` through `8` | Derived | Point record layout. The default depends on version and whether `COLOR_0` is present. |
| `las.scale` | `[number, number, number]` | `[0.001, 0.001, 0.001]` | Coordinate scale factors used to quantize positions into LAS integer coordinates. |
| `las.offset` | `[number, number, number]` | Mesh minimum position | Coordinate offsets used to quantize positions into LAS integer coordinates. |
| `las.colorDepth` | `number \| string` | - | Declares the source color component depth. |
| `las.chunkSize` | `number` | `50000` | Number of points per fixed-size LAZ chunk. |
