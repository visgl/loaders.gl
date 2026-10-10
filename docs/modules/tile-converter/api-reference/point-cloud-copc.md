# Point-cloud attribute mapping and COPC output

The v5 adapters support explicit point attribute mapping and bounded COPC batch authoring.
COPC output reuses `@loaders.gl/copc`'s writer, which owns LAS 1.4/LAZ encoding and octree layout.

```typescript
import {encodePointCloudCOPC} from '@loaders.gl/tile-converter/v5';

const result = await encodePointCloudCOPC(decodedPointMeshOrArrowTable, {
  mapping: {
    attributes: {POSITION: 'POSITION', COLOR_0: 'rgb', intensity: 'INTENSITY', stableId: 'featureId'}
  },
  extraBytes: [{attribute: 'stableId', name: 'point_id'}],
  scale: [0.001, 0.001, 0.001],
  offset: [500000, 4000000, 0],
  wkt: sourceWkt,
  maxPositionError: 0.001
});
// Store or download result.copc with the application's file service.
// Inspect result.maximumPositionError and result.droppedAttributes.
```

## Explicit mapping

`mapPointCloudAttributes(input, mapping)` returns a decoded Mesh and sorted loss declarations.
Every source attribute must be mapped or explicitly omitted with a nonempty reason. No aliases,
casts, normalizations or CRS changes are inferred. Renamed Mesh attributes share immutable source
values; Arrow input is decoded to Mesh. Null point values require preprocessing.

COPC supports packed floating XYZ; uint8/uint16 RGB; intensity, classification, NIR, GPS time,
scan angle, user data, point source ID, returns, scanner channel and classification flags.
Integer fields are checked against their actual bit ranges before writing, so masks cannot hide
out-of-range values. Custom typed attributes, including exact signed/unsigned 64-bit IDs, can be retained with explicit
`extraBytes` descriptors (one or three components). Normalized custom values require a caller
conversion. Other unsupported attributes require an explicit supported mapping or drop reason. RGBA requires a caller
conversion to RGB with an explicit alpha-loss policy.

## Coordinates and precision

Coordinates must already be absolute positions in the supplied WKT CRS. Relative origins, model
matrices and source placement must be applied by the caller, optionally using the existing explicit
spatial preparation API. This adapter performs no projection or CRS inference.

Scale, offset and maximum Euclidean error are required. Signed int32 quantization range and actual
rounding error are checked before compression. Output selects LAS PDRF 6 (no RGB), 7 (RGB), or 8
(NIR); supplied uint16 colors retain their component values.

## Budgets and lifecycle

Default ceilings are 64 MiB of distinct retained input buffers, one million points and 128 MiB of
completed encoded output. The output ceiling is checked after the owning writer returns; its
compression, raw LAS records and temporary octree memory are additional. These are not total-heap
or out-of-core guarantees. Cancellation is cooperative during precision checks and checked around
writer execution; the synchronous compression call cannot be interrupted.

`createCOPCConversionCodec(options)` plugs into `convertTileset`, producing **one independent COPC
file per decoded input batch**. Writes, finalization and abort use the existing v5 sink lifecycle.
It does not combine source tiles into one dataset or preserve a supplied source LOD hierarchy.
Whole-dataset assembly, streaming authoring and broader independent PDAL/viewer
qualification remain separate tracker gates.
