---
title: Tile-converter v5 CLI
description: Bounded metadata inspection, selected mesh conversion and target-profile validation.
---

# Tile-converter v5 CLI

The experimental `tile-converter-v5` command inspects explicit 3D Tiles and converts selected
static native-ECEF GLB/B3DM meshes or supported I3S leaf meshes. Install `@loaders.gl/tile-converter` to use its binary.
The original `tile-converter` command remains the v4 conversion CLI.

## Inspect and select

`inspect` reads metadata only. It accepts a JSON path/file URL, HTTP(S) JSON URL, or local
3TZ archive (local or remote). It also accepts HTTP(S) I3S layer URLs and local/remote
SLPK archives through an explicit input format. Declared external tilesets with **.json URIs** are expanded without loading
geometry, textures or attributes. The JSON result includes distinct placement IDs, declaring
document snapshots/URLs, local tile paths, composed transforms and aggregate metadata bytes.
Local inputs use a synthetic URL for confined resolution; `input` retains the supplied path.
Missing mesh payload files do not fail inspection. Extensionless external metadata is not
probed by this profile; implicit tiling is rejected.

```sh
tile-converter-v5 inspect ./dataset/tileset.json
tile-converter-v5 inspect https://example.com/tileset.json
tile-converter-v5 inspect ./dataset.3tz --input-format 3tz
tile-converter-v5 inspect https://example.com/layers/0 --input-format i3s
tile-converter-v5 inspect ./dataset.slpk --input-format slpk
```

## Convert and validate

Copy placement IDs from inspection and repeat `--resource` for multiple selections.
Selections are processed in declaration order; select between 1 and 64 distinct contents.
In the default flat profile, multiple selections must be source leaves. A selected content may contain multiple static
primitives, up to 64 meshes in total. Declaring-document glTF axes, composed placement and
relative URLs are retained during extraction. Feature-bearing contents require an explicit
[feature-schema mapping](#feature-schema-controls). Node service callers supply the same
`features` (3D Tiles) or `i3sFeatures` (I3S) mapping to `convertNodeTileset`.

```sh
tile-converter-v5 convert ./dataset/tileset.json \
  --resource tile-root-content-0 \
  --output-format 3tz --output ./selected.3tz

tile-converter-v5 convert ./dataset.3tz --input-format 3tz \
  --resource tile-root-content-0 \
  --output-format slpk --output ./selected.slpk

tile-converter-v5 validate ./dataset/tileset.json \
  --resource tile-root-content-0 --output-format 3tz
```

Targets are `3d-tiles` (a new directory with `tileset.json` and GLBs), `3tz` or `slpk`.
The format is explicit and is not inferred from the destination filename. Existing destinations
are never overwritten. Parent directories must exist. Archive chunks are written with
backpressure to a temporary sibling and published as a complete file using an exclusive hard
link. Directory output is visible while writing; incomplete directories are removed on error
or cancellation. This is not a crash-recovery or durable-resume contract.

`validate` decodes, converts and verifies the selected target profile, including archive
packaging, without writing a destination. It requires selections and forbids `--output`.
It is **not a whole-dataset validator** and does not establish independent viewer interoperability.

Output uses the shared browser mesh profiles: 3D Tiles 1.1 GLB with lossless Draco Edge Breaker,
or I3S 1.7 3DObject/SLPK. By default it is a **partial flat mesh collection**, preserving placement but
not source hierarchy/LOD or ADD/REPLACE refinement. Use the qualified
[complete hierarchy profile](#preserve-a-complete-explicit-hierarchy) to retain these for 3D Tiles targets. For 3D Tiles input, every selected ancestor must declare a
finite nonnegative metric geometric error; the conservative error includes ancestor transform
scaling and the 1 cm reconstruction allowance. Unknown/incompatible CRS, implicit tiling,
instancing/composites and appearance/features outside the existing mesh profiles fail explicitly.
Selected documents must have the same coordinate epoch as the root. Documents without a
declared CRS inherit the qualified root reference; explicit epoch mismatches are rejected
because epoch transformations are unsupported.

## I3S and archive inputs

I3S inspection lists only leaf mesh nodes, using their declared node IDs as selections.
It reads layer/node metadata without fetching geometry, textures or attributes. Conversion
uses original-coordinate decoding and the existing shared CRS/elevation preparation; it does
not apply renderer projection. Only the existing 3DObject/IntegratedMesh mesh, appearance and
explicit feature profiles are supported.

```sh
tile-converter-v5 convert ./dataset.slpk --input-format slpk \
  --resource 1 --geometric-error 2 \
  --output-format 3tz --output ./selected.3tz
```

For I3S to either 3D Tiles target, supply `--geometric-error` in meters. Screen-size LOD is
not inferred as metric error. The output adds the 1 cm reconstruction allowance. IntegratedMesh
to SLPK requires `--integrated-mesh-policy as-3d-object`; the report records the authorized
layer-type change. Native coordinates/CRS must be supported by the existing spatial context;
unsupported definitions, vertical or epoch operations fail explicitly.

Remote SLPK and 3TZ use indexed HTTP ranges. Servers must return HTTP 206, valid
Content-Range and a stable strong ETag or Last-Modified validator. Changed identities fail;
there is no fallback to a full download. Weak or malformed ETags are rejected, even when a Last-Modified header is also present; the Last-Modified fallback requires an absent ETag and a valid Date at least 60 seconds later. Browser servers must expose Date for this fallback. See [HTTP validator semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.2.2). Browser CORS requirements do not apply to Node.
Archives and dependencies remain confined to their virtual root, without network fallback.
I3S layer query parameters are inherited only within the same origin and layer path. Use final
resource URLs: Node I3S resource redirects are rejected until their relative bases are qualified.

## Options and limits

| Option | Default | Purpose |
| --- | --- | --- |
| `--preserve-hierarchy` | `false` | Require a complete explicit hierarchy across inspected documents for 3D Tiles/3TZ output |
| `--input-format` | `3d-tiles` | `3d-tiles`, `3tz`, `i3s` or `slpk` |
| `--geometric-error` | | Required metric source error for I3S to 3D Tiles |
| `--integrated-mesh-policy` | | `as-3d-object` authorizes IntegratedMesh to SLPK |
| `--feature-schema` | | Local UTF-8 JSON feature class/schema mapping, at most 64 KiB; convert/validate only |
| `--resource` | | Required selected placement ID for convert/validate; repeatable |
| `--output-format` | `3tz` | `3d-tiles`, `3tz` or `slpk` |
| `--output` | | New destination; required only for convert |
| `--max-input-bytes` | `16777216` | Lower transport/physical-read and decoded mesh budgets |
| `--max-resources` | `1000` | Lower content declarations (3D Tiles) or inspected nodes (I3S) |
| `--max-documents` | `32` | Lower the root/external document-placement limit |
| `--max-output-bytes` | `33554432` | Lower retained file bytes and, separately, archive bytes |
| `--help` | | Show usage |

Limits must be positive decimal integers within those ceilings. Archive file size and aggregate
indexed physical reads are also capped by the input limit. Metadata, raw meshes and their buffers
and images share the transport budget; decoded geometry, encoded images and Arrow data have a
separate byte gate. These limits do not bound total peak decoder/decompressor memory.
Local dependencies, including symlinks, stay within the root document's real directory or archive.
HTTP(S) datasets must remain unchanged across inspection and content reads; no remote dataset
snapshot is claimed. Bundled Draco assets are loaded separately from dataset resources.

Successful operations write JSON to stdout and exit zero. Invalid arguments, unreadable inputs,
unsupported profiles and exceeded budgets write JSON errors to stderr and exit nonzero. SIGINT
cancels cooperatively and releases source/output handles. Help prints text.

Full hierarchy/LOD preservation, service configuration, durable recovery and installed Windows
qualification remain follow-ups. See the
[v5 source API](/docs/modules/tile-converter/api-reference/v5-conversion#node-inspection-and-raw-content-reads).


## Preserve a complete explicit hierarchy

After inspecting an explicit 3D Tiles dataset, including declared `.json` external tilesets, select every content placement and
add `--preserve-hierarchy` to `convert` or `validate`:

```sh
tile-converter-v5 convert ./tileset.json --preserve-hierarchy \
  --resource tile-root-content-0 --resource tile-0-content-0 \
  --output-format 3tz --output ./converted.3tz
```

This retains source topology, parent content, inherited ADD/REPLACE and conservative
metric errors plus the position allowance (transform scaling for 1.1; native meter values for 1.0). Effective placement is retained through
relative output transforms; bounds are recomputed around converted subtree geometry.
Every declaring-document root must declare its own refinement. Every content must decode to one mesh primitive.
The profile supports at most 32 document placements (including repeated URLs), 256 tiles
in total and 64 selected binary contents, with existing byte limits. External references
become contentless wrappers around the referenced root; they must have no source children.
Ordered 3D Tiles 1.1 mesh `contents` arrays remain on their original tile. Each content has a
distinct placement ID; select them all. The source processes declaration order regardless of
flag order, and rebases all GLBs on a tile around the first content's origin. Bounds include
every content and child; distant contents that cannot meet the 1 cm float32 precision gate
fail explicitly. Arrays with one entry are normalized to `content`. External JSON references
continue to require a single `content`, with no siblings or source children.
It rejects 1.0 `contents` arrays, contentless leaves,
unmapped metadata/extensions/request volumes, I3S/SLPK input and SLPK output.
See the [complete hierarchy profile](../api-reference/v5-conversion.md#complete-explicit-hierarchy-profile)
for the shared browser/service API and remaining qualification. Nested content IDs include
the complete external-reference chain, such as `tile-root-content-0/tile-root-content-0`.


## Feature-schema controls

Use `--feature-schema ./features.json` with either `convert` or `validate`. The local file
contains the existing source mapping directly (no `features` or `i3sFeatures` wrapper):

```json
{
  "metadataClass": "building",
  "sourceFeatureIdProperty": "object_id",
  "featureIdField": "feature_id",
  "schema": {
    "fields": [
      {"name": "feature_id", "type": "uint64", "nullable": false},
      {"name": "label", "type": "utf8", "nullable": true}
    ]
  }
}
```

`metadataClass` and `schema.fields` are required. For 3D Tiles, select the exact inline
structural-metadata class, or label a legacy batch table. `sourceFeatureIdProperty` selects
stable source identifiers; omit it to use integer table-row IDs. `featureIdField` defaults
to `feature_id`. Include every remaining source property in the schema; unmapped properties
fail instead of being dropped. Fields accept explicit `int8/16/32/64`, `uint8/16/32/64`,
`float32`, `float64` or `utf8` types, optional boolean `nullable`, and string-valued
`metadata`. The identifier must be nonnullable and use an integer or string type.
Optional `batchSize` is 1–65,536. The schema may also contain string-valued `metadata`.
Unknown keys, nested/boolean/enum fields and raw metadata controls are rejected by this CLI.

For I3S/SLPK input, also provide `objectIdProperty` (the exact geometry-ID column) and
`maxAttributeBytes` (positive, at most 16 MiB per node). This is a separate attribute gate;
the shared transport and decoded-data budgets still apply. For example, select `OBJECTID`
as both `objectIdProperty` and `sourceFeatureIdProperty` and map it to `feature_id`.
Dates, domains and custom mappers remain outside this scalar/string profile.

Target support is narrower than the accepted source schema: I3S attributes support `int32`,
`float64`, `utf8`, and explicitly authorized 64-bit decimal strings. Other numeric widths
are not automatically widened.

GLB output preserves exact 64-bit integers. SLPK output requires explicit
`"integer64Encoding": "decimal-string"` to authorize their string representation; no
numeric coercion is inferred. This mapping does not add support for multiple property
classes or texture/implicit feature IDs. The JSON configuration has its own 64 KiB read
limit and does not count as dataset bytes. See the [feature profiles](../api-reference/v5-conversion.md#declared-gltf-feature-schemas)
for the source/destination semantic checks.
