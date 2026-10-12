---
title: Tile-converter v5 CLI
description: Bounded metadata inspection, selected mesh conversion and target-profile validation.
---

# Tile-converter v5 CLI

The experimental `tile-converter-v5` command inspects explicit 3D Tiles and converts selected
static native-ECEF GLB/B3DM meshes. Install `@loaders.gl/tile-converter` to use its binary.
The original `tile-converter` command remains the v4 conversion CLI.

## Inspect and select

`inspect` reads metadata only. It accepts a JSON path/file URL, HTTP(S) JSON URL, or local
3TZ archive. Declared external tilesets with **.json URIs** are expanded without loading
geometry, textures or attributes. The JSON result includes distinct placement IDs, declaring
document snapshots/URLs, local tile paths, composed transforms and aggregate metadata bytes.
Local inputs use a synthetic URL for confined resolution; `input` retains the supplied path.
Missing mesh payload files do not fail inspection. Extensionless external metadata is not
probed by this profile; implicit tiling is rejected.

```sh
tile-converter-v5 inspect ./dataset/tileset.json
tile-converter-v5 inspect https://example.com/tileset.json
tile-converter-v5 inspect ./dataset.3tz --input-format 3tz
```

## Convert and validate

Copy placement IDs from inspection and repeat `--resource` for multiple selections.
Selections are processed in declaration order; select between 1 and 64 distinct contents.
Multiple selections must be source leaves. A selected content may contain multiple static
primitives, up to 64 meshes in total. Declaring-document glTF axes, composed placement and
relative URLs are retained during extraction. This initial CLI profile is geometry-only:
feature-bearing contents require explicit schema/class mappings and are rejected. Node service
callers can supply `features` to `convertNodeTileset`.

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
or I3S 1.7 3DObject/SLPK. It is a **partial flat mesh collection**, preserving placement but
not source hierarchy/LOD or ADD/REPLACE refinement. Every selected ancestor must declare a
finite nonnegative metric geometric error; the conservative error includes ancestor transform
scaling and the 1 cm reconstruction allowance. Unknown/incompatible CRS, implicit tiling,
instancing/composites and appearance/features outside the existing mesh profiles fail explicitly.
Selected documents must have the same coordinate epoch as the root. Documents without a
declared CRS inherit the qualified root reference; explicit epoch mismatches are rejected
because epoch transformations are unsupported.

## Options and limits

| Option | Default | Purpose |
| --- | --- | --- |
| `--input-format` | `3d-tiles` | JSON, or `3tz` for a local archive |
| `--resource` | | Required selected placement ID for convert/validate; repeatable |
| `--output-format` | `3tz` | `3d-tiles`, `3tz` or `slpk` |
| `--output` | | New destination; required only for convert |
| `--max-input-bytes` | `16777216` | Lower transport/physical-read and decoded mesh budgets |
| `--max-resources` | `1000` | Lower the content-declaration limit, including external references |
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

I3S/SLPK inputs, remote archive inputs, services, full hierarchy/LOD preservation, durable recovery
and installed Windows qualification remain follow-ups. See the
[v5 source API](/docs/modules/tile-converter/api-reference/v5-conversion#node-inspection-and-raw-content-reads).
