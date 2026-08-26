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

The writer requires a `POSITION` attribute. It can select LAS versions 1.0-1.4 and PDRF 0-10. Represented input attributes include color, intensity, classification, GPS time, NIR, return and scanner metadata, waveform packet references, and configured Extra Bytes. Fields without a corresponding input attribute are zero-filled.

LAZ output supports PDRF 0-10. Legacy formats use LASzip compressor 2 and item version 2; modern formats use layered compressor 3 and item version 3. PDRF 4/5 and 9/10 preserve waveform packet references; waveform sample payload storage remains outside the writer. Fixed-size chunk tables are the default, and variable-size tables can be enabled when needed. The output is readable by the TypeScript loader. Interoperability is covered by independent LASzip fixtures and by bundled WASM comparisons for the item sets those variants support. COPC output is provided separately by [`COPCWriter`](/docs/modules/copc/api-reference/copc-writer) to keep the LAS and COPC packages acyclic.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `las.format` | LAS or LAZ | `'las'` | Output container. Both LAS and LAZ are implemented. Use `COPCWriter` for COPC output. |
| `las.version` | `'1.0'` through `'1.4'` | `'1.2'` or `'1.4'` | LAS header version. The default is 1.4 for modern PDRFs and 1.2 otherwise. |
| `las.pointDataRecordFormat` | `0` through `10` | Derived | Point record layout. The default depends on version and whether `COLOR_0` is present. |
| `las.scale` | `[number, number, number]` | `[0.001, 0.001, 0.001]` | Coordinate scale factors used to quantize positions into LAS integer coordinates. |
| `las.offset` | `[number, number, number]` | Mesh minimum position | Coordinate offsets used to quantize positions into LAS integer coordinates. |
| `las.colorDepth` | `number \| string` | - | Declares the source color component depth. |
| `las.chunkSize` | `number` | `50000` | Number of points per LAZ chunk. |
| `las.variableChunkTable` | `boolean` | `false` | Use a variable-size LAZ chunk table and store each chunk's point count. |

Use `las.extraBytes` to append one- or three-component typed mesh attributes to each point record and emit an Extra Bytes VLR. Each entry accepts an `attribute` name and optional `name` and `description`; the writer infers the LAS data type from the typed array and attribute size. LAS Extra Bytes has no four-component data type, so four-component attributes are rejected.

For modern PDRFs, the writer also maps optional point attributes named `gpsTime`, `scanAngle`, `userData`, `pointSourceId`, `returnNumber`, `numberOfReturns`, `scannerChannel`, `scanDirectionFlag`, `edgeOfFlightLine`, `synthetic`, `keyPoint`, `withheld`, and `overlap`. For PDRF 8 and 10, the optional `nir` attribute is written as a 16-bit near-infrared channel. Missing fields are zero-filled.

Waveform PDRFs 4, 5, 9, and 10 map `wavePacketDescriptorIndex`, `wavePacketOffset`, `wavePacketSize`, `wavePacketReturnPoint`, and the three-component `wavePacketVector` attribute into each point's 29-byte packet reference. PDRF 10 also maps `COLOR_0` and `nir`.
