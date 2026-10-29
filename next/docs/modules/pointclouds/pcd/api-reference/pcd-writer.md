PCD module · writer API

PCD

# PCDWriter

Encode loaders.gl mesh or Mesh Arrow table point clouds as readable Point Cloud Data text, preserving common position, normal, and color attributes.

[PCD format](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)[PCDLoader](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)[PCD module](https://loaders.gl/next/docs/modules/pointclouds/pcd.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/pointclouds/pcd.md)

PCD[Try It](https://loaders.gl/next/examples/pointclouds/pcd)[Overview](https://loaders.gl/next/docs/modules/pointclouds/pcd/formats/pcd.md)[Format](https://loaders.gl/next/docs/modules/pointclouds/pcd/format.md)[PCDLoader](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)[PCDWriter](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md)

What it writes

## Export point attributes in a format tools can inspect.

PCDWriter accepts the same point-cloud table family used by loaders.gl readers and writes an ASCII PCD header plus point records.

01

Input

Mesh or Mesh Arrow table

02

Output

ASCII Point Cloud Data text

03

Attributes

Positions, normals, and packed color

04

Boundary

Readable output, not compressed binary

Detailed guide

## PCDWriter reference

The sections below document usage, input normalization, supported attributes, and current options.

The `PCDWriter` writes [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) or [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) point cloud data as ASCII Point Cloud Data (PCD) text.

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import type {Mesh, MeshArrowTable} from '@loaders.gl/core/schema';

import {PCDWriter} from '@loaders.gl/pointclouds/pcd';



declare const pointCloud: Mesh | MeshArrowTable;



const arrayBuffer = await encode(pointCloud, PCDWriter);

const text = PCDWriter.encodeTextSync(pointCloud);
```

## Data Format[​](#data-format "Direct link to Data Format")

`PCDWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before PCD text is encoded.

The writer requires a `POSITION` attribute. It writes `NORMAL` and `COLOR_0` attributes when present. Colors are packed into the PCD `rgb` float field convention.

## Options[​](#options "Direct link to Options")

`PCDWriter` does not currently define format-specific options.
