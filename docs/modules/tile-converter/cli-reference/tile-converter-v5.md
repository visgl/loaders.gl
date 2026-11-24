# Tile-converter v5 CLI

Use `tile-converter` to inspect a tileset, convert selected meshes, or check a conversion without writing files. The CLI accepts 3D Tiles JSON, 3TZ archives, I3S layers and SLPK archives. It writes a 3D Tiles directory, a 3TZ archive or an SLPK package. See the [supported features](https://loaders.gl/docs/modules/tile-converter/cli-reference/supported-features.md) for format and mesh restrictions.

```
npm install -g @loaders.gl/tile-converter@beta

tile-converter --help
```

Use the `beta` npm tag for the v5 prerelease. The default command runs v5. `tile-converter-v5` is an alias. For existing scripts, see the [migration table](https://loaders.gl/docs/upgrade-guide.md#tile-converter-defaults-to-v5) and the [original v4 flag reference](https://loaders.gl/docs/modules/tile-converter/cli-reference/tile-converter.md).

## Common commands[​](#common-commands "Direct link to Common commands")

| Command            | What it does                                                                          |
| ------------------ | ------------------------------------------------------------------------------------- |
| `inspect <input>`  | List available content placements and metadata.                                       |
| `convert <input>`  | Convert the selected placements and publish a new destination.                        |
| `validate <input>` | Decode, convert and package the selected placements without publishing a destination. |

### Inspect and select[​](#inspect-and-select "Direct link to Inspect and select")

`inspect` lists placement IDs without loading mesh payloads. Pass `--input-format` for archive and I3S inputs.

```
tile-converter inspect ./dataset/tileset.json

tile-converter inspect https://example.com/tileset.json

tile-converter inspect ./dataset.3tz --input-format 3tz

tile-converter inspect https://example.com/layers/0 --input-format i3s

tile-converter inspect ./dataset.slpk --input-format slpk
```

### Convert and validate[​](#convert-and-validate "Direct link to Convert and validate")

Copy a placement ID from `inspect` and pass it with `--resource`. Repeat the option for more placements, or use `--all-contents` for a qualified 3D Tiles or 3TZ dataset. Validate uses the same selection and output flags as convert and omits `--output`.

```
tile-converter convert ./dataset/tileset.json \

  --resource tile-root-content-0 \

  --output-format 3tz --output ./selected.3tz



tile-converter convert ./dataset.3tz --input-format 3tz \

  --resource tile-root-content-0 \

  --output-format slpk --output ./selected.slpk



tile-converter validate ./dataset/tileset.json \

  --resource tile-root-content-0 --output-format 3tz
```

A conversion normally produces a flat mesh collection. Use [`--preserve-hierarchy`](#preserve-a-complete-explicit-hierarchy) when you need the source tile tree and the dataset fits that profile.

## Options and limits[​](#options-and-limits "Direct link to Options and limits")

### Input and selection[​](#input-and-selection "Direct link to Input and selection")

| Option                   | Default    | Purpose                                                                                 |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------- |
| `--input-format`         | `3d-tiles` | Input profile: `3d-tiles`, `3tz`, `i3s` or `slpk`.                                      |
| `--resource ID`          |            | Select a content placement for convert or validate. Repeat to select more than one.     |
| `--all-contents`         | Off        | Select every inspected 3D Tiles or 3TZ content placement. Use in place of `--resource`. |
| `--draft-feature-schema` | Off        | Draft a feature mapping from B3DM batch tables during 3D Tiles or 3TZ inspection.       |
| `--feature-schema PATH`  |            | Local UTF-8 JSON feature mapping, at most 64 KiB, for convert or validate.              |

### Output and conversion[​](#output-and-conversion "Direct link to Output and conversion")

| Option                                  | Default | Purpose                                                                                |
| --------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `--output-format`                       | `3tz`   | Target profile: `3d-tiles`, `3tz` or `slpk`.                                           |
| `--output PATH`                         |         | New destination. Required for convert and forbidden for validate.                      |
| `--preserve-hierarchy`                  | Off     | Require a complete explicit hierarchy across inspected documents.                      |
| `--geometric-error N`                   |         | Source error in meters, required for I3S to 3D Tiles or 3TZ.                           |
| `--slpk-lod-threshold N`                |         | Positive I3S `maxScreenThresholdSQ` for SLPK replacement hierarchy.                    |
| `--integrated-mesh-policy as-3d-object` |         | Authorize IntegratedMesh to SLPK as 3DObject.                                          |
| `--omit-feature-id`                     | Off     | Omit the feature identifier attribute in SLPK.                                         |
| `--no-draco`                            | Off     | Write uncompressed SLPK geometry.                                                      |
| `--name NAME`                           |         | Set the SLPK layer name.                                                               |
| `--egm2008-grid PATH`                   |         | Convert ellipsoidal heights with a local GeographicLib EGM2008 PGM grid up to 128 MiB. |
| `--declare-egm2008-heights`             | Off     | Declare existing EGM2008 orthometric heights in 3D Tiles or 3TZ to SLPK output.        |

### Budgets and reporting[​](#budgets-and-reporting "Direct link to Budgets and reporting")

| Option                 | Default | Purpose                                                                                                |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `--max-input-bytes N`  | 16 MiB  | Bound transport reads and decoded mesh bytes. The 3D Tiles and 3TZ input ceiling is 256 MiB.           |
| `--max-resources N`    | 1,000   | Lower the limit on 3D Tiles content declarations or I3S inspected nodes.                               |
| `--max-documents N`    | 32      | Set the root and external document-placement limit, up to 256.                                         |
| `--max-meshes N`       | 64      | Set the content and primitive placement limits for 3D Tiles or 3TZ to SLPK, up to 1,000.               |
| `--max-output-bytes N` | 32 MiB  | Bound combined resource bytes and archive bytes independently. Archives can opt in to a larger budget. |
| `--profile`            | Off     | Include elapsed stage timings in the convert or validate JSON report.                                  |
| `--version`            |         | Print the installed package version and converter implementation.                                      |
| `--help`               |         | Show usage.                                                                                            |

Successful operations write JSON to stdout and exit zero. Invalid arguments, unreadable inputs, unsupported profiles and exceeded budgets write JSON errors to stderr and exit nonzero. SIGINT cancels cooperatively and releases source/output handles. Help and version flags print text. The CLI includes a `converter` identity object in JSON results and errors.

## Advanced usage[​](#advanced-usage "Direct link to Advanced usage")

### Inspection details[​](#inspection-details "Direct link to Inspection details")

Declared external tilesets with **.json URIs** are expanded without loading geometry, textures or attributes. The JSON result includes distinct placement IDs, declaring document snapshots/URLs, local tile paths, composed transforms and aggregate metadata bytes. Local inputs use a synthetic URL for confined resolution; `input` retains the supplied path. Missing mesh payload files do not fail inspection. Extensionless external metadata is not probed by this profile; implicit tiling is rejected.

### Select a conversion profile[​](#select-a-conversion-profile "Direct link to Select a conversion profile")

Selections are processed in declaration order. The default limit is 64 contents and mesh primitives. For flat 3D Tiles or 3TZ to SLPK conversion, raise it with `--max-meshes`. In the default flat profile, multiple selections generally must be source leaves. For Node SLPK output, an explicit selection may also include content on an ADD parent with children in the same declaring tileset document. Each selected nonleaf and each edge from it to a selected descendant must use effective ADD refinement; REPLACE or mixed refinement paths are rejected. The selected primitives become independent I3S leaves, not a copy of the source LOD tree. The `--preserve-hierarchy` supports SLPK replacement LOD with an explicit screen threshold. A selected content may contain multiple static primitives. Declaring-document glTF axes, composed placement and relative URLs are retained during extraction. Feature-bearing contents require an explicit [feature-schema mapping](#feature-schema-controls). Node service callers supply the same `features` (3D Tiles) or `i3sFeatures` (I3S) mapping to `convertNodeTileset`.

Output uses the shared browser mesh profiles: 3D Tiles 1.1 GLB with lossless Draco Edge Breaker, or I3S 1.7 3DObject/SLPK. By default it is a **partial flat mesh collection**, preserving placement but not source hierarchy/LOD or ADD/REPLACE refinement. Use the qualified [complete hierarchy profile](#preserve-a-complete-explicit-hierarchy) to retain these for 3D Tiles targets. For 3D Tiles input, every selected ancestor must declare a finite nonnegative metric geometric error; the conservative error includes ancestor transform scaling and the 1 cm reconstruction allowance. Unknown/incompatible CRS, implicit tiling, instancing/composites and appearance/features outside the existing mesh profiles fail explicitly. Selected documents must have the same coordinate epoch as the root. Documents without a declared CRS inherit the qualified root reference; explicit epoch mismatches are rejected because epoch transformations are unsupported.

### Output publication and limits[​](#output-publication-and-limits "Direct link to Output publication and limits")

Targets are `3d-tiles` (a new directory with `tileset.json` and GLBs), `3tz` or `slpk`. The format is explicit and is not inferred from the destination filename. Existing destinations are never overwritten. Parent directories must exist. Archive chunks are written with backpressure to a temporary sibling and published as a complete file using an exclusive hard link. Directory output is visible while writing; incomplete directories are removed on error or cancellation. This is not a crash-recovery or durable-resume contract.

For 3TZ and SLPK, the Node CLI stages encoded resources in the system temporary directory and streams the indexed archive from those files. Allow space for both the staged resources and the final archive during packaging. Archive validation also uses temporary disk space. Node SLPK writes textured nodes independently, so repeated textures can increase archive size. The 32 MiB default, 3D Tiles directory output cap, and independent input limits still apply.

Limits must be positive decimal integers within those ceilings. Archive file size and aggregate indexed physical reads are also capped by the input limit. Metadata, raw meshes and their buffers and images share the transport budget; decoded geometry, encoded images and Arrow data have a separate byte gate. These limits do not bound total peak decoder/decompressor memory. Local dependencies, including symlinks, stay within the root document's real directory or archive. HTTP(S) datasets must remain unchanged across inspection and content reads; no remote dataset snapshot is claimed. Bundled Draco assets are loaded separately from dataset resources.

With `--profile`, `report.timings` separates source/codec work from awaited writes and includes Node setup, archive/output publication and total elapsed milliseconds. See [profiling semantics](https://loaders.gl/docs/modules/tile-converter/api-reference/v5-conversion.md#conversion-profiling).

### I3S and archive inputs[​](#i3s-and-archive-inputs "Direct link to I3S and archive inputs")

I3S inspection lists only leaf mesh nodes, using their declared node IDs as selections. It reads layer/node metadata without fetching geometry, textures or attributes. Conversion uses original-coordinate decoding and the existing shared CRS/elevation preparation; it does not apply renderer projection. Only the existing 3DObject/IntegratedMesh mesh, appearance and explicit feature profiles are supported.

```
tile-converter convert ./dataset.slpk --input-format slpk \

  --resource 1 --geometric-error 2 \

  --output-format 3tz --output ./selected.3tz
```

For I3S to either 3D Tiles target, supply `--geometric-error` in meters. Screen-size LOD is not inferred as metric error. The output adds the 1 cm reconstruction allowance. IntegratedMesh to SLPK requires `--integrated-mesh-policy as-3d-object`; the report records the authorized layer-type change. Native coordinates/CRS must be supported by the existing spatial context; unsupported definitions, vertical or epoch operations fail explicitly.

Remote SLPK and 3TZ use indexed HTTP ranges. Servers must return HTTP 206, valid Content-Range and a stable strong ETag or Last-Modified validator. Changed identities fail; there is no fallback to a full download. Weak or malformed ETags are rejected, even when a Last-Modified header is also present; the Last-Modified fallback requires an absent ETag and a valid Date at least 60 seconds later. Browser servers must expose Date for this fallback. See [HTTP validator semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.2.2). Browser CORS requirements do not apply to Node. Archives and dependencies remain confined to their virtual root, without network fallback. I3S layer query parameters are inherited only within the same origin and layer path. Use final resource URLs: Node I3S resource redirects are rejected until their relative bases are qualified.

### Preserve a complete explicit hierarchy[​](#preserve-a-complete-explicit-hierarchy "Direct link to Preserve a complete explicit hierarchy")

#### 3D Tiles and 3TZ output[​](#3d-tiles-and-3tz-output "Direct link to 3D Tiles and 3TZ output")

After inspecting an explicit 3D Tiles dataset, including declared `.json` external tilesets, select every content placement and add `--preserve-hierarchy` to `convert` or `validate`:

```
tile-converter convert ./tileset.json --preserve-hierarchy \

  --resource tile-root-content-0 --resource tile-0-content-0 \

  --output-format 3tz --output ./converted.3tz
```

This retains source topology, parent content, inherited ADD/REPLACE and conservative metric errors plus the position allowance (transform scaling for 1.1; native meter values for 1.0). Effective placement is retained through relative output transforms; bounds are recomputed around converted subtree geometry. Every declaring-document root must declare its own refinement. Each binary content may contain multiple static mesh primitives and scene-node placements, with at most 64 primitive placements across the whole conversion. Each primitive becomes a GLB in the original tile’s ordered `contents` list; child order, refinement and LOD remain on that tile. Output order follows source content slots, then scene traversal and mesh primitive order. The profile supports at most 32 document placements (including repeated URLs), 256 tiles in total and 64 selected binary contents, with existing byte limits. External references become contentless wrappers around the referenced root; they must have no source children. Ordered 3D Tiles 1.1 mesh `contents` arrays remain on their original tile. Each content has a distinct placement ID; select them all. The source processes declaration order regardless of flag order, and rebases all GLBs on a tile around the first primitive's origin. Bounds include every content and child; distant contents that cannot meet the 1 cm float32 precision gate fail explicitly. Arrays with one entry are normalized to `content`. External JSON references continue to require a single `content`, with no siblings or source children. It rejects 1.0 `contents` arrays, contentless leaves, unmapped metadata/extensions/request volumes, and I3S/SLPK input. See the [complete hierarchy profile](https://loaders.gl/docs/modules/tile-converter/api-reference/v5-conversion.md#complete-explicit-hierarchy-profile) for the shared browser/service API and remaining qualification. Nested content IDs include the complete external-reference chain, such as `tile-root-content-0/tile-root-content-0`.

#### SLPK output[​](#slpk-output "Direct link to SLPK output")

For replacement LOD, use `--preserve-hierarchy --slpk-lod-threshold N` with a positive I3S `maxScreenThresholdSQ` value. This profile requires a complete explicit REPLACE hierarchy with at most one content per tile and one primitive per content. It uses the existing hierarchy limits of 32 document placements, 256 tiles, and 64 meshes. Contentless ancestors collapse to their nearest geometry-bearing ancestor or the synthetic root. Internal meshes retain their geometry and use the supplied threshold. Legacy node documents also carry the equivalent screen-diameter threshold.

Source geometric errors are preserved for 3D Tiles/3TZ output. SLPK uses the explicit screen threshold and the source’s existing meshes.

### Feature-schema controls[​](#feature-schema-controls "Direct link to Feature-schema controls")

Use `tile-converter inspect ./tileset.json --draft-feature-schema` to scan bounded legacy B3DM batch tables without decoding mesh geometry. Save the report’s `featureSchema` object as a schema file, review inferred types and field aliases, and pass it to `convert --feature-schema`. The report lists skipped contents, omitted properties, and nullable numeric fields that need an explicit I3S null replacement policy. The draft’s `omitSourceProperties` list explicitly excludes unsupported legacy source columns.

Use `--feature-schema ./features.json` with either `convert` or `validate`. The local file contains the existing source mapping directly (no `features` or `i3sFeatures` wrapper):

```
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

`metadataClass` and `schema.fields` are required. For 3D Tiles, select the exact inline structural-metadata class, or label a legacy batch table. `sourceFeatureIdProperty` selects stable source identifiers; omit it to use integer table-row IDs. `featureIdField` defaults to `feature_id`. Include every remaining source property in the schema; unmapped properties fail instead of being dropped. Fields accept explicit `int8/16/32/64`, `uint8/16/32/64`, `float32`, `float64` or `utf8` types, optional boolean `nullable`, and string-valued `metadata`. The identifier must be nonnullable and use an integer or string type. Optional `batchSize` is 1–65,536. The schema may also contain string-valued `metadata`. Unknown keys, nested/boolean/enum fields and raw metadata controls are rejected by this CLI.

For I3S/SLPK input, also provide `objectIdProperty` (the exact geometry-ID column) and `maxAttributeBytes` (positive, at most 16 MiB per node). This is a separate attribute gate; the shared transport and decoded-data budgets still apply. For example, select `OBJECTID` as both `objectIdProperty` and `sourceFeatureIdProperty` and map it to `feature_id`. Dates, domains and custom mappers remain outside this scalar/string profile.

Target support is narrower than the accepted source schema: I3S attributes support `int32`, `float64`, `utf8`, and explicitly authorized 64-bit decimal strings. Other numeric widths are not automatically widened.

GLB output preserves exact 64-bit integers. SLPK output requires explicit `"integer64Encoding": "decimal-string"` to authorize their string representation; no numeric coercion is inferred. This mapping does not add support for multiple property classes or texture/implicit feature IDs. The JSON configuration has its own 64 KiB read limit and does not count as dataset bytes. See the [feature profiles](https://loaders.gl/docs/modules/tile-converter/api-reference/v5-conversion.md#declared-gltf-feature-schemas) for the source/destination semantic checks.

SLPK collections share byte-identical encoded texture sets with compatible texture profiles across mesh nodes. Geometry, UVs and material definitions remain per mesh. Both node pages and legacy node indices reference the shared texture owner.

For legacy B3DM inputs, SLPK uses one OBJECTID per original batch-table row within each selected content placement, including across material nodes. Use `--omit-feature-id` to hide the feature identifier attribute while keeping OBJECTID available for picking and queries.

For 3D Tiles to SLPK, add `"i3sFieldNames": {"gml:id": "gml_id"}` alongside `schema` in the feature mapping file. Keep the original column name in `schema.fields`. The output uses `gml_id` as its field name and `gml:id` as its display alias. Output names must be unique ignoring case and cannot use the reserved `OBJECTID` name.

Set `"coerceNumericStrings": true` in the feature mapping file to accept decimal strings in legacy B3DM batch-table properties declared as integer, float32, or float64 columns. Integer strings must contain whole decimal digits, with an optional sign. Blank strings, hexadecimal, and floating point overflow fail validation. Feature identifiers and null handling follow their existing schema rules.

For 3D Tiles to SLPK, a feature mapping can specify `"i3sNumericNullValues": {"measuredHeight": -9999}` to replace nulls in a nullable `int32` or `float64` column. Use the source field name, even when the output field is renamed. Choose a value outside the valid domain and configure consumers to treat it as missing. It is stored as an ordinary number in SLPK. Without a replacement, numeric nulls fail validation.

For Node 3D Tiles and 3TZ inspection or flat conversion, `--max-documents` sets the root and external document placement budget from 1 to 256. The default is 32. Hierarchy-preserving output still supports up to 32 document placements. Input bytes and selected meshes have separate limits.

### Native-ECEF source metadata[​](#native-ecef-source-metadata "Direct link to Native-ECEF source metadata")

For 3D Tiles, the mesh adapter accepts native EPSG:4978 XYZ coordinates in meters with ellipsoidal heights. A correctly enclosing WGS84 root `boundingVolume.region` can establish the format-default frame. A box/sphere-bounded dataset can instead declare its actual frame through an inline metadata class:

```
{

  "schema": {

    "classes": {

      "frame": {

        "properties": {

          "crs": {"type": "STRING", "semantic": "TILESET_CRS_GEOCENTRIC"}

        }

      }

    }

  },

  "metadata": {"class": "frame", "properties": {"crs": "EPSG:4978"}}

}
```

Add these declaration fields to the existing 3D Tiles 1.1 document; retain its real bounds, transforms and contents. Declaring a CRS does not reproject geometry, and coordinates are never guessed to be ECEF from their magnitude.

The selected class must contain only an explicit `STRING` CRS property and an optional explicit `SCALAR` / `FLOAT64` property with semantic `TILESET_CRS_COORDINATE_EPOCH`. Both values must agree with the loader's resolved spatial reference. Defaults, arrays, value transforms, entity extras/extensions, unresolved/external schemas, duplicate semantics, unrelated properties and nonempty `groups` remain outside this profile. They fail with `MESH_SOURCE_METADATA_UNSUPPORTED`; `--feature-schema` maps mesh features, not dataset metadata. Undeclared or non-ECEF frames remain rejected. Hierarchy-preserving output keeps its separate restriction on dataset schemas/metadata; this exception applies to selected mesh conversion. See the [mesh source profile](https://loaders.gl/docs/modules/tile-converter/api-reference/v5-conversion.md#source-mesh-to-i3sslpk) for the other restrictions.

### Orthometric heights[​](#orthometric-heights "Direct link to Orthometric heights")

For 3D Tiles or 3TZ input whose derived heights already represent EGM2008 orthometric meters, use `--declare-egm2008-heights` to declare EPSG:3855 in the SLPK. This changes layer metadata only. To convert ellipsoidal input instead, pass `--egm2008-grid /path/to/egm2008-5.pgm`. Use a local GeographicLib EGM2008 PGM grid up to 128 MiB. The converter subtracts the interpolated undulation before encoding positions and building bounds. The two options are mutually exclusive. The default is ellipsoidal. SLPK package metadata is stored as plain `metadata.json`.
