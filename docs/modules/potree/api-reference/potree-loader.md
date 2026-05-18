import {PotreeDocsTabs} from '@site/src/components/docs/potree-docs-tabs';

# PotreeLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

<PotreeDocsTabs active="loader" />

`PotreeLoader` parses Potree dataset metadata. Binary point attribute tiles referenced by that metadata are parsed by `PotreeBinLoader`.

When the Potree metadata exposes binary point tiles, `PotreeBinLoader` can return either a legacy mesh or a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables). Set `potree.shape: 'arrow-table'` and `potree.interleaved: true` to allocate one packed vertex-record buffer per tile and populate it directly while parsing.

```typescript
import {PotreeBinLoader} from '@loaders.gl/potree';
import {load} from '@loaders.gl/core';

const table = await load(url, PotreeBinLoader, {
  potree: {
    shape: 'arrow-table',
    interleaved: true,
    pointAttributes: ['POSITION_CARTESIAN', 'RGB_PACKED'],
    scale,
    positionOrigin
  }
});
```

Packed Potree tile output uses one `vertexData: FixedSizeBinary<byteStride>` Arrow column. The schema metadata and the loaders.gl `packedLayout` mirror describe a WebGPU-oriented interleaved layout with `POSITION` and optional `COLOR_0`.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `potree.shape` | `'mesh' \| 'arrow-table'` | `'mesh'` | Selects mesh or Mesh Arrow table tile output. |
| `potree.interleaved` | `boolean` | `false` | With `shape: 'arrow-table'`, emits direct-written packed vertex records for binary Potree point tiles. |
