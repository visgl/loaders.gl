# PCDWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/-EXPERIMENTAL-orange.svg?style=flat-square" alt="EXPERIMENTAL" />
</p>

The `PCDWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) point cloud data as ASCII Point Cloud Data (PCD) text.

| Writer         | Characteristic                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------- |
| File Format    | [PCD](/docs/modules/pcd/formats/pcd)                                                           |
| Data Format    | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| File Extension | `.pcd`                                                                                         |
| File Type      | Text                                                                                           |
| Supported APIs | `encode`, `encodeSync`, `encodeTextSync`                                                       |

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {PCDWriter} from '@loaders.gl/pcd';

declare const pointCloud: Mesh | MeshArrowTable;

const arrayBuffer = await encode(pointCloud, PCDWriter);
const text = PCDWriter.encodeTextSync(pointCloud);
```

## Data Format

`PCDWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before PCD text is encoded.

The writer requires a `POSITION` attribute. It writes `NORMAL` and `COLOR_0` attributes when present. Colors are packed into the PCD `rgb` float field convention.

## Options

`PCDWriter` does not currently define format-specific options.
