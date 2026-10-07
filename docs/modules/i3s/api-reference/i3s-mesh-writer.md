# encodeI3SMeshLayer

Authors a small I3S 1.7 **3D Object** layer from one untextured triangle mesh using portable
ArrayBuffer, typed-array, TextEncoder, and GZIP APIs. Package the result with `SLPKWriter`.

```ts
import {encodeI3SMeshLayer} from '@loaders.gl/i3s/i3s-mesh-writer';
import {SLPKWriter} from '@loaders.gl/i3s/i3s-slpk-writer';

const layer = encodeI3SMeshLayer(absoluteEcefMesh, {
  name: 'My mesh',
  maxPositionError: 0.001, // meters
  maxResourceBytes: 8 * 1024 * 1024
});
const archive = await SLPKWriter.encode(layer.files, {
  slpk: {maxArchiveBytes: 16 * 1024 * 1024}
});
```

Also exported from `@loaders.gl/i3s`. The input uses `MeshGeometry` with triangle-list mode 4,
packed Float32 or Float64 absolute EPSG:4978 positions, optional unit Float32 ECEF normals,
and optional packed unsigned indices. Input arrays remain unchanged. Indices are expanded;
triangles retain their winding. The output includes an empty root and a mesh leaf, paged and
legacy node indices, geometry, scalar attributes, layer metadata, and archive metadata.
Every resource is individually GZIP compressed with a deterministic timestamp.

Output positions use WGS84 longitude/latitude and ellipsoidal height relative to the leaf
center. The writer measures reconstruction error in ECEF meters and rejects positions above
`maxPositionError`. Bounds include the reconstructed vertices and numerical center error.
Antimeridian wrapping, undefined geographic coordinates, textures, vertex colors/UVs,
and unknown layouts/attributes are outside this initial profile.

## Appearance

`material` supports one untextured metallic/roughness material: `baseColorFactor`,
`metallicFactor`, `roughnessFactor`, `alphaMode`, `alphaCutoff`, and `doubleSided`.
MASK uses an explicit cutoff of 0.5 when omitted, preserving the glTF default rather than
substituting the I3S default. Input RGB factors are linear, as in glTF; the writer applies the
sRGB transfer curve required by the I3S material profile. Alpha is unchanged. The I3S reader
converts material RGB back to linear values for rendering. Other material semantics fail explicitly.

## Features

`features` accepts explicit-schema Arrow batches from one metadata class, a non-null unique
`featureIdField`, and a `Uint32Array` `triangleFeatureIndices` containing one table row index
per triangle. Batches share a schema and retain their original row order. Triangles are stably
grouped by row to form I3S face ranges. Mixed-feature triangles and rows without geometry
are rejected. I3S geometry and the synthetic `OBJECTID` column use local row numbers;
stable source identifiers remain in their own property column. `OBJECTID` is reserved.

The initial property mapping supports:

| Arrow type | I3S representation | Null policy |
| --- | --- | --- |
| `utf8` | UTF-8 String | Zero byte count for null; a terminator byte for empty string |
| `int32` | Int32 | Null values rejected |
| `float64` | Float64 | Nonfinite and null values rejected |
| `int64`, `uint64` | Exact decimal String | Requires `integer64Encoding: 'decimal-string'`; nullable properties retain null |

The explicit 64-bit policy preserves every digit, including identifiers above 2^53, while
changing the target field type to String. `decimalStringFields` lists these mappings so the
application can report them. Other numeric widths, booleans, enums, arrays, multiple classes,
and raw metadata need separately qualified mappings. No automatic string coercion or
lossy numeric conversion is performed. Read string attributes with `i3s.attributeValues: 'exact'`
to preserve null versus empty strings and strip only the terminator. Strings reject embedded nulls and malformed Unicode.

The layout follows the [I3S geometry specification](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/geometryBuffer.cmn.md)
and [attribute layout](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md).

## Limits and qualification

`maxResourceBytes` caps each emitted resource before GZIP. The archive writer has a separate
complete archive cap. These limits do not bound peak decoder, Arrow, serialization, or
compression allocations. Cancellation is checked by the converter between synchronous
writing steps. The browser example performs conversion in a disposable module worker and
can interrupt it by terminating that worker.

The profile is experimental. Schema validation, independently decoded binary layout,
reader interoperability, and declared precision are required. A representative independent
viewer check does not establish compatibility with every ArcGIS version or production dataset.

For raw geometry, Cesium 1.146.0 independently decodes and renders the representative two-feature mesh with
its material and exact decimal identifiers. That viewer's attribute reader currently treats
null strings as empty and misdecodes non-ASCII UTF-8. The archive follows the published
UTF-8/null layout; loaders.gl exact attribute mode verifies those values independently.
ArcGIS viewer qualification and broader dataset profiles remain follow-up work.

## Lossless Draco geometry

`encodeI3SMeshLayerWithDraco(mesh, options, libraryOptions?)` is the asynchronous alternative
exported by the same root and `i3s-mesh-writer` entrypoints. It reuses the raw writer's
geographic preparation and precision limits, then encodes geometry with Draco Edge Breaker
without quantization. Normals and triangle feature ownership are preserved, with the required
I3S feature-index metadata. Decoded oriented attribute/feature tuples are verified before
publishing resources, including duplicate triangles and winding. Node-page vertex counts
reflect Draco's decoded vertex count. Other layer, material and feature resources retain
their encoding; all resources remain individually GZIP compressed.

```ts
import {encodeI3SMeshLayerWithDraco} from '@loaders.gl/i3s/i3s-mesh-writer';
import {getDracoLibraryOptions} from '@loaders.gl/draco/bundled';

const layer = await encodeI3SMeshLayerWithDraco(
  mesh,
  {maxPositionError: 0.001, maxResourceBytes: 8 * 1024 * 1024},
  getDracoLibraryOptions()
);
```

Both encoder and full decoder runtimes are required. Application overrides use the existing
`modules`, `CDN` and `useLocalLibraries` controls; omitted controls retain Draco's defaults.
The glTF subset is not selected for I3S verification. `maxResourceBytes` also applies to the
encoded Draco buffer and finalized JSON resources. The temporary expanded raw geometry
is working memory, not an emitted resource. The limit does not cap codec/verification
allocations or total peak memory. The existing synchronous writer remains available for
raw geometry, including degenerate triangles that Draco cannot preserve. Very small geometry
resources may grow. Independent ArcGIS viewer qualification remains follow-up work.

Compression metadata follows the [I3S 1.7 compressed-attribute contract](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/compressedAttributes.cmn.md).
