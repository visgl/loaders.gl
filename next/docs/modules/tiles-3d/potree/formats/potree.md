Point-cloud dataset format

# Potree

Potree datasets separate metadata, octree hierarchy, and point payloads. Applications can inspect the hierarchy and progressively load the nodes they need. loaders.gl reads legacy and modern layouts and writes explicit binary output profiles.

[Potree module](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)[Potree source](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)[Potree writers](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-writer.md)

[Try It](https://loaders.gl/next/examples/pointclouds/potree-source)[Overview](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)[Format](https://loaders.gl/next/docs/modules/tiles-3d/potree/formats/potree.md)[PotreeLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-loader.md)[PotreeSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md)

The dataset layout

## Find nodes before decoding points.

Metadata declares the layout, attributes, coordinate scale, and bounds. The hierarchy identifies node payloads, and the source loads those payloads as traversal requests them.

01

Metadata

cloud.js for legacy datasets; metadata.json for 2.0

02

Hierarchy

Inline or paged legacy trees; range-readable 2.0 pages

03

Points

Individual legacy node files or ranges in octree.bin

04

Write

Metadata or complete file collections from decoded Mesh/Arrow data

Detailed guide

## Format compatibility

The tables below describe the loaders.gl implementation, including supported dataset versions, read-only encodings, attribute preservation, and authoring limits.

## Dataset versions[​](#dataset-versions "Direct link to Dataset versions")

Dataset versions describe the wire layout. They are distinct from Potree viewer and PotreeConverter release numbers: PotreeConverter 2.x emits the **2.0 dataset format**.

| Dataset version | Read              | Write      | Layout                                                                   |
| --------------- | ----------------- | ---------- | ------------------------------------------------------------------------ |
| 1.0–1.3         | ✅                | ✅         | Absolute float32 XYZ/RGBA; flat extensionless nodes and inline hierarchy |
| 1.4             | ✅                | ✅         | Quantized node-relative XYZ; flat binary nodes and inline hierarchy      |
| 1.5–1.8         | ✅                | ✅ binary  | Paged HRC hierarchy; binary, LAS or LAZ node payloads                    |
| 2.0             | ✅ DEFAULT/BROTLI | ✅ DEFAULT | Three-file range-readable octree from PotreeConverter 2.x                |

Legacy datasets use `cloud.js` plus individual node resources. Versions 1.5–1.8 add `.hrc` hierarchy pages and nested node directories. Modern datasets use `metadata.json`, `hierarchy.bin`, and `octree.bin`; hierarchy entries locate point payloads by byte range and can refer to additional hierarchy pages.

## Feature support[​](#feature-support "Direct link to Feature support")

These symbols describe implemented support within the stated profile; they do not imply independent certification against every producer or viewer.

| Symbol | Meaning                                                 |
| ------ | ------------------------------------------------------- |
| ✅     | Supported within the stated profile                     |
| ⚠️     | Partial support or a version/representation restriction |
| ✕      | Not implemented                                         |
| —      | Not applicable                                          |

| Feature                                | Read   | Write  | Notes                                                                                                                                          |
| -------------------------------------- | ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Metadata and declared attributes       | ✅     | ✅     | One `PotreeLoader` selects the metadata validator from the dataset version                                                                     |
| Legacy inline hierarchy                | ✅     | ✅     | Versions 1.0–1.4; later sources also accept declared inline trees                                                                              |
| Legacy paged HRC hierarchy             | ✅     | ✅     | Versions 1.5–1.8; readers also accept complete trees deeper than the declared page step                                                        |
| Modern hierarchy pages and proxies     | ✅     | ✅     | 2.0 reader resolves proxies lazily; writer emits a complete hierarchy collection                                                               |
| Legacy binary point records            | ✅     | ✅     | Attribute layouts depend on the dataset version                                                                                                |
| Legacy LAS/LAZ node payloads           | ✅     | ✕      | Reading delegates to LAS/LAZ decoding; dataset output uses binary nodes                                                                        |
| Modern DEFAULT encoding                | ✅     | ✅     | Interleaved little-endian point attributes                                                                                                     |
| Modern BROTLI encoding                 | ✅     | ✕      | Attribute-major payloads with Morton-encoded positions and RGB                                                                                 |
| XYZ coordinate precision               | ✅     | ✅     | Early absolute float32, later legacy node-relative uint32, and modern int32 plus axis scale/offset; writers check the declared rounding budget |
| RGB color                              | ✅     | ✅     | Modern uint16 color is retained; writing uint8 colors to 2.0 multiplies components by 257                                                      |
| RGBA color                             | ⚠️     | ✅     | Modern DEFAULT retains four components; BROTLI requires RGB, and legacy decoded colors retain the existing RGB output behavior                 |
| Intensity, classification, and normals | ✅     | ⚠️     | Legacy writers accept declared standard layouts; modern numeric attributes retain their component types                                        |
| Custom numeric attributes              | ✅ 2.0 | ✅ 2.0 | All ten scalar types: signed/unsigned 8-, 16-, 32-, and 64-bit integers, float32, and float64                                                  |
| Exact 64-bit attribute values          | ✅ 2.0 | ✅ 2.0 | Point values stay exact; JSON min/max statistics can be approximate above Number's exact integer range                                         |
| Custom normalization metadata          | ✅ 2.0 | ✅ 2.0 | A loaders.gl metadata extension; independent viewer behavior requires qualification                                                            |
| CRS declaration                        | ✅     | ✅     | Modern native coordinates retain the declaration; writers do not infer or apply a CRS transformation                                           |
| Progressive tile traversal             | ✅     | —      | One `PotreeSourceLoader` exposes the shared point-cloud tile methods                                                                           |
| Query scans and Arrow batches          | ⚠️     | —      | Compatible legacy layouts support `scan()`; modern sources report metadata-only query support                                                  |
| Mesh/Arrow dataset authoring           | —      | ✅     | Accepts a decoded point Mesh, MeshArrowTable, or explicitly owned additive octree nodes                                                        |
| Automatic sampling and LOD generation  | —      | ✕      | Applications supply node ownership; the writer does not sample or duplicate points                                                             |
| Out-of-core dataset authoring          | —      | ✕      | Complete output files and temporary encoding buffers are held in memory                                                                        |

Modern point decoding returns Float64 XYZ using the declared scale and offset. Legacy source projection behavior is retained; native modern source coordinates require application placement. CRS conversion is an explicit application step before writing. See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md).

## Loaders, sources, and writers[​](#loaders-sources-and-writers "Direct link to Loaders, sources, and writers")

* [PotreeLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-loader.md) parses metadata for both layouts. The package root is metadata-only; direct parser access uses `PotreeLoaderWithParser` from `@loaders.gl/tiles-3d/potree/potree-loader`.
* [PotreeSourceLoader](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-source-loader.md) traverses hierarchy and decodes requested point tiles. Pass `cloud.js` for 1.x or `metadata.json` for 2.0; directory inputs retain the legacy `cloud.js` default.
* [PotreeWriter](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-writer.md) writes a metadata document through `encode` or `encodeSync`. `encodePotreeDataset` produces the complete collection of relative filenames and typed byte buffers from decoded Mesh/Arrow data.

Modern source tile content uses Mesh Arrow tables. Compatible legacy queries yield ordered Arrow point batches. The dataset writer accepts decoded, unindexed point data with finite XYZ and representable numeric attributes; unsupported attributes require an explicit application mapping.

## Resource limits and qualification[​](#resource-limits-and-qualification "Direct link to Resource limits and qualification")

Modern sources enforce metadata, aggregate hierarchy, per-tile point, and node limits, and support cancellation. HTTP servers must honor the requested byte range. The dataset writer defaults to 256 MiB of encoded output and 100,000 input nodes, with explicit precision and cancellation controls. See the source and writer references for options and defaults.

These limits do not bound total heap: input data, Arrow conversion, temporary buffers, and application caches consume additional memory. Storage, archive packaging, and downloads are application responsibilities.

Small deterministic fixtures cover every legacy minor version, modern DEFAULT/BROTLI decoding, attribute fidelity, malformed inputs, range traversal, and writer round trips. Broader independent Potree viewer/producer interoperability, peak-memory qualification, modern query scans, BROTLI output, and out-of-core authoring remain follow-ups.
