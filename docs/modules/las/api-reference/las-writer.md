import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LASWriter

<LasDocsTabs active="laswriter" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `LASWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) point cloud data as uncompressed LAS binary data.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {LASWriter} from '@loaders.gl/las';

declare const pointCloud: Mesh | MeshArrowTable;

const arrayBuffer = await encode(pointCloud, LASWriter, {
  las: {
    scale: [0.001, 0.001, 0.001]
  }
});
```

## Data Format

`LASWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before LAS binary data is encoded.

The writer requires a `POSITION` attribute. It writes `COLOR_0`, `intensity`, and `classification` attributes when present. `LASWriter` writes uncompressed LAS 1.2 output; it does not write LAZ-compressed output.

## Options

| Option       | Type                       | Default                 | Description                                                                 |
| ------------ | -------------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `las.scale`  | `[number, number, number]` | `[0.001, 0.001, 0.001]` | Coordinate scale factors used to quantize positions into LAS integer coordinates. |
| `las.offset` | `[number, number, number]` | Mesh minimum position   | Coordinate offsets used to quantize positions into LAS integer coordinates. |
