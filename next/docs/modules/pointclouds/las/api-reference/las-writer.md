LAS module · writer API

LAS

# LASWriter

Write loaders.gl mesh or Arrow point-cloud data as LAS or LAZ, with control over point record formats, quantization, compression chunks, and rich point attributes.

[LAS format](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[LAS module](https://loaders.gl/next/docs/modules/pointclouds/las.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/las.md)[COPCWriter](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-writer.md)

LAS[Try It](https://loaders.gl/next/examples/pointclouds/las)[Benchmarks](https://loaders.gl/next/docs/modules/pointclouds/las/benchmarks.md)[Overview](https://loaders.gl/next/docs/modules/pointclouds/las/formats/las.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/las/format.md)[LASLoader](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)[LASWriter](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)

What it writes

## Turn typed point data into a standard point-cloud file.

LASWriter maps common mesh attributes into LAS point records, then optionally compresses them as LAZ. The result can be read by loaders.gl and other LAS-compatible tools.

01

Input

Mesh or Mesh Arrow table

02

Containers

LAS and compressed LAZ

03

Records

PDRF 0–10 and LAS 1.0–1.4

04

Attributes

Color, time, classification, waveform, and extras

Detailed guide

## LASWriter reference

The sections below document usage, supported data mapping, options, compression, and interoperability details.

The `LASWriter` writes [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) point cloud data as LAS or LAZ binary data.

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import type {Mesh, MeshArrowTable} from '@loaders.gl/core/schema';

import {LASWriter} from '@loaders.gl/pointclouds/las';



declare const pointCloud: Mesh | MeshArrowTable;



const arrayBuffer = await encode(pointCloud, LASWriter, {

  las: {

    format: 'laz',

    scale: [0.001, 0.001, 0.001]

  }

});
```

## Data Format[​](#data-format "Direct link to Data Format")

`LASWriter` accepts Mesh Arrow tables and legacy Mesh objects. Arrow table input is normalized to the writer's Mesh representation before LAS binary data is encoded.

The writer requires a `POSITION` attribute. It can select LAS versions 1.0-1.4 and PDRF 0-10. Represented input attributes include color, intensity, classification, GPS time, NIR, return and scanner metadata, waveform packet references, and configured Extra Bytes. Fields without a corresponding input attribute are zero-filled.

LAZ output supports PDRF 0-10. Legacy formats use LASzip compressor 2 and item version 2; modern formats use layered compressor 3 and item version 3. PDRF 4/5 and 9/10 preserve waveform packet references; waveform sample payload storage remains outside the writer. Fixed-size chunk tables are the default, and variable-size tables can be enabled when needed. The output is readable by the TypeScript loader. Interoperability is covered by independent LASzip fixtures and by bundled WASM comparisons for the item sets those variants support. COPC output is provided separately by [`COPCWriter`](https://loaders.gl/next/docs/modules/tiles-3d/copc/api-reference/copc-writer.md) to keep the LAS and COPC packages acyclic.

## Options[​](#options "Direct link to Options")

| Option                      | Type                       | Default                 | Description                                                                                                                                                               |
| --------------------------- | -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `las.format`                | LAS or LAZ                 | `'las'`                 | Output container. Both LAS and LAZ are implemented. Use `COPCWriter` for COPC output.                                                                                     |
| `las.version`               | `'1.0'` through `'1.4'`    | `'1.2'` or `'1.4'`      | LAS header version. The default is 1.4 for modern PDRFs and 1.2 otherwise.                                                                                                |
| `las.pointDataRecordFormat` | `0` through `10`           | Derived                 | Point record layout. The default depends on version and whether `COLOR_0` is present.                                                                                     |
| `las.scale`                 | `[number, number, number]` | `[0.001, 0.001, 0.001]` | Coordinate scale factors used to quantize positions into LAS integer coordinates.                                                                                         |
| `las.offset`                | `[number, number, number]` | Mesh minimum position   | Coordinate offsets used to quantize positions into LAS integer coordinates.                                                                                               |
| `las.colorDepth`            | `number \| string`         | -                       | `8` scales source RGB by 257, `16` preserves UInt16 component values. `auto` or omitted retains legacy inference; normalized attributes use their declared normalization. |
| `las.chunkSize`             | `number`                   | `50000`                 | Number of points per LAZ chunk.                                                                                                                                           |
| `las.variableChunkTable`    | `boolean`                  | `false`                 | Use a variable-size LAZ chunk table and store each chunk's point count.                                                                                                   |

Use `las.extraBytes` to append one- or three-component typed mesh attributes to each point record and emit an Extra Bytes VLR. Each entry accepts an `attribute` name and optional `name` and `description`; the writer infers the LAS data type from the typed array and attribute size. Names and descriptions are fixed-width ASCII fields; non-ASCII text is rejected to avoid changing metadata. LAS Extra Bytes has no four-component data type, so four-component attributes are rejected.

For modern PDRFs, the writer also maps optional point attributes named `gpsTime`, `scanAngle`, `userData`, `pointSourceId`, `returnNumber`, `numberOfReturns`, `scannerChannel`, `scanDirectionFlag`, `edgeOfFlightLine`, `synthetic`, `keyPoint`, `withheld`, and `overlap`. For PDRF 8 and 10, the optional `nir` attribute is written as a 16-bit near-infrared channel. Missing fields are zero-filled.

Waveform PDRFs 4, 5, 9, and 10 map `wavePacketDescriptorIndex`, `wavePacketOffset`, `wavePacketSize`, `wavePacketReturnPoint`, and the three-component `wavePacketVector` attribute into each point's 29-byte packet reference. PDRF 10 also maps `COLOR_0` and `nir`.
