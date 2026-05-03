# KSPLATLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`KSPLATLoader` parses GaussianSplats3D `.ksplat` files and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

| Property     | Value                 |
| ------------ | --------------------- |
| File format  | [KSPLAT](/docs/modules/splats/formats/splats) |
| Extensions   | `.ksplat`             |
| Worker       | No                    |
| Input type   | `ArrayBuffer`         |
| Output shape | `arrow-table`         |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {KSPLATLoader} from '@loaders.gl/splats';

const table = await load(url, KSPLATLoader);
```

The loader decodes complete in-memory files. It does not expose GaussianSplats3D's progressive section loading API.

## Options

| Option         | Type            | Default         | Description                              |
| -------------- | --------------- | --------------- | ---------------------------------------- |
| `splats.shape` | `'arrow-table'` | `'arrow-table'` | Selects Mesh Arrow table output. V1 only supports `arrow-table`. |
