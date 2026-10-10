# Potree writers

`encodePotreeDataset()` encodes a complete Potree file collection using ArrayBuffer and typed
arrays. `PotreeWriter` encodes a metadata document through the standard loaders.gl writer API.

```typescript
import {encodePotreeDataset} from '@loaders.gl/potree';

const dataset = await encodePotreeDataset(pointMeshOrArrowTable, {
  potree: {version: '2.0', scale: [0.001, 0.001, 0.001], projection: 'EPSG:4978'}
});
for (const [relativePath, bytes] of dataset.files) {
  // Store bytes with the application's browser or Node file service.
}
```

The default is 2.0 DEFAULT encoding. A single decoded unindexed point Mesh or MeshArrowTable
becomes a root node. To write an existing octree, supply a connected array of
`{id: 'r' | 'r0' | 'r07' | ..., mesh}` nodes. Rows must belong exclusively to their additive node;
the writer neither samples nor duplicates them. XYZ octant bits are 4/2/1. All nodes must have
matching attribute layouts and points within their native octant bounds. An application can
supply nodes from a dynamic point tiler and package the resulting files separately.

## Compatibility

| Requested dataset version | Output |
| --- | --- |
| 1.0–1.3 | `cloud.js`, embedded hierarchy, flat extensionless nodes, absolute float32 XYZ + RGBA |
| 1.4 | `cloud.js`, embedded hierarchy, flat `.bin` nodes, node-relative uint32 XYZ |
| 1.5–1.8 | `cloud.js`, paged `.hrc` hierarchy and nested `.bin` nodes |
| 2.0 | `metadata.json`, `hierarchy.bin`, `octree.bin`, DEFAULT interleaved attributes |

Modern output retains all ten scalar widths, exact 64-bit IDs and custom normalization metadata.
Uint8 RGB/RGBA is promoted to uint16 with `component * 257`; uint16 color is preserved.
JSON attribute range statistics are approximate for values above Number's exact integer range;
encoded point values remain exact. Custom normalization is a loaders.gl metadata extension.

Legacy layouts accept only their declared standard attributes. The earliest layout has XYZ and
RGBA only; absent color is opaque white. Later layouts include intensity, classification and
supported encoded normals. Unrepresentable attributes fail with a request for explicit mapping.
Legacy readers retain their existing RGB output behavior. Output does not generate LAS/LAZ node
payloads or BROTLI encoding; the readers can consume those existing dataset encodings.

## Options

All options are in `potree`:

| Option | Default | Meaning |
| --- | --- | --- |
| `version` | `2.0` | Dataset wire version, 1.0–1.8 or 2.0 |
| `scale` | `[0.001, 0.001, 0.001]` | XYZ quantization; legacy requires equal axis scales |
| `maxPositionError` | Half the largest scale | Maximum rounding error, including early float32 output |
| `hierarchyStepSize` | `5` | Legacy hierarchy page/folder depth, 1–24 |
| `spacing` | Cube width / 128, or 1 | Root spacing in native units |
| `projection` | Unset | Explicit CRS declaration; never inferred or applied |
| `maxOutputBytes` | 256 MiB | Aggregate encoded files |
| `maxNodes` | 100000 | Connected input node count |
| `signal` | Unset | Cancellation between node encodes |

Input, Arrow conversion, temporary node buffers and application caches consume additional heap.
The helper is an in-memory dataset writer, not an out-of-core tiling service. Coordinates must fit
the declared precision and integer range; lossy attribute mappings and CRS conversion are explicit
application steps. Storage, ZIP packaging, downloads and CLI services remain outside this writer.
