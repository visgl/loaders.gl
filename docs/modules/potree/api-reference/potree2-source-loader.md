# Potree2SourceLoader

Progressively reads Potree 2.0 datasets (`metadata.json`, `hierarchy.bin`, `octree.bin`).
PotreeConverter 2.x, including 2.1.5, writes the **2.0 dataset format**; converter release numbers
and viewer release numbers are distinct from dataset versions.

```typescript
import {Potree2SourceLoader} from '@loaders.gl/potree';
import {PointCloudTileset} from '@loaders.gl/tiles';

const loader = await Potree2SourceLoader.preload();
const source = loader.createDataSource('https://example.com/cloud/metadata.json');
await source.initialize();
const tileset = new PointCloudTileset(source);
// Select tiles using the application's viewport and placement.
// When done:
source.close();
```

Direct runtime access is available through `@loaders.gl/potree/potree2-source-loader` (factory)
and `@loaders.gl/potree/potree2-source` (`Potree2Source`). The package root exposes metadata,
options, types and writers. `Potree2Loader` / `@loaders.gl/potree/potree2-loader` parse just the
metadata document.

## Traversal and content

- `ready` and `initialize()` wait for metadata and the first hierarchy page.
- `getMetadata()` returns an independent declaration, including the supplied projection.
- `getRootTile()` and `getChildren(tile)` resolve required hierarchy proxies and share concurrent
  reads of the same proxy. Immediate child proxies are resolved before returning their headers.
- `loadTileContent(tile)` reads only that node's byte range and returns Arrow point data.
  Caller header counts and ranges are ignored; the source owns the validated hierarchy.
- `close()` cancels pending I/O and releases hierarchy state. Repeated calls are safe.

DEFAULT records and BROTLI attribute-major Morton records are supported. Native XYZ is returned
as Float64 positions using the declared axis scale and offset. RGB remains normalized uint16;
custom attributes preserve all ten scalar types, including exact signed and unsigned 64-bit IDs.
Positions and colors also have `POSITION` and `COLOR_0` aliases. No reprojection or CRS inference
is performed. Applications supply placement for native cartesian coordinates.

This source satisfies the point-cloud traversal contract used by the v5 tile-converter. It does
not yet provide the legacy source's `scan()` query API. Use `PotreeSourceLoader` for `cloud.js`
datasets (1.0–1.8).

## HTTP and limits

Servers must honor Range requests with status 206 and the exact requested Content-Range.
Relative resource URLs use the final metadata response URL and retain its query credentials.
Inject a transport with `core.fetch`; all I/O uses the portable DataSource fetch API.

Options in `potree2`:

| Option | Default | Scope |
| --- | --- | --- |
| `maxMetadataBytes` | 1 MiB | Metadata response |
| `maxHierarchyBytes` | 16 MiB | Aggregate hierarchy page responses |
| `maxPointBytes` | 64 MiB | Compressed range and declared decoded wire/attribute bytes per node |
| `maxNodes` | 100000 | Discovered hierarchy nodes |
| `signal` | — | Source lifetime cancellation |

These limits cover resources and declared output allocations, not total JavaScript heap.
Brotli fallback decompression can allocate temporary output before its decoded length is checked;
Arrow conversion, cached application content and temporary response chunks require additional
memory. Metadata is validated before point allocation; hierarchy offsets retain exact uint64
values until they are checked against the supported fetch range.

## Format references

- [PotreeConverter 2.1.5](https://github.com/potree/PotreeConverter/releases/tag/2.1.5)
- [Potree 2.0 loader](https://github.com/potree/potree/blob/develop/src/modules/loader/2.0/OctreeLoader.js)
- [Brotli decoder layout](https://github.com/potree/potree/blob/develop/src/modules/loader/2.0/DecoderWorker_brotli.js)
