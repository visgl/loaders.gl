# SPLATLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`SPLATLoader` parses raw `.splat` Gaussian splat files and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

| Property     | Value                 |
| ------------ | --------------------- |
| File format  | [SPLAT](/docs/modules/splats/formats/splats) |
| Extensions   | `.splat`              |
| Worker       | No                    |
| Input type   | `ArrayBuffer`         |
| Output shape | `arrow-table`         |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {SPLATLoader} from '@loaders.gl/splats';

const table = await load(url, SPLATLoader);
```

The returned table uses GraphDECO-style Gaussian splat columns and can be passed to `SplatLayer`.

## Options

| Option         | Type            | Default         | Description                              |
| -------------- | --------------- | --------------- | ---------------------------------------- |
| `splats.shape` | `'arrow-table'` | `'arrow-table'` | Selects Mesh Arrow table output. V1 only supports `arrow-table`. |
