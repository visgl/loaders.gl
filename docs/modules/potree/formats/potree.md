---
title: Potree format
description: An octree point-cloud dataset format with progressive reads and explicit legacy and modern writer profiles.
hide_title: true
page_style: designed
---

import {PotreeDocsTabs} from '@site/src/components/docs/potree-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Point-cloud dataset format"
  title="Potree"
  description="Potree datasets separate metadata, octree hierarchy, and point payloads. Applications can inspect the hierarchy and progressively load the nodes they need. loaders.gl reads legacy and modern layouts and writes explicit binary output profiles."
  tone="violet"
  meta={['Dataset versions 1.0–1.8 and 2.0', 'Progressive octree reads', 'Typed attributes']}
  links={[
    {label: 'Potree module', to: '/docs/modules/potree'},
    {label: 'Potree source', to: '/docs/modules/potree/api-reference/potree-source-loader'},
    {label: 'Potree writers', to: '/docs/modules/potree/api-reference/potree-writer'}
  ]}
/>

<PotreeDocsTabs active="format" />

<DocOrientation
  eyebrow="The dataset layout"
  title="Find nodes before decoding points."
  description="Metadata declares the layout, attributes, coordinate scale, and bounds. The hierarchy identifies node payloads, and the source loads those payloads as traversal requests them."
  tone="violet"
  items={[
    {label: 'Metadata', value: 'cloud.js for legacy datasets; metadata.json for 2.0'},
    {label: 'Hierarchy', value: 'Inline or paged legacy trees; range-readable 2.0 pages'},
    {label: 'Points', value: 'Individual legacy node files or ranges in octree.bin'},
    {label: 'Write', value: 'Metadata or complete file collections from decoded Mesh/Arrow data'}
  ]}
/>

<ReferenceBoundary
  title="Format compatibility"
  description="The tables below describe the loaders.gl implementation, including supported dataset versions, read-only encodings, attribute preservation, and authoring limits."
  tone="violet"
/>

## Dataset versions

Dataset versions describe the wire layout. They are distinct from Potree viewer and
PotreeConverter release numbers: PotreeConverter 2.x emits the **2.0 dataset format**.

| Dataset version | Read | Write | Layout |
| --- | --- | --- | --- |
| 1.0–1.3 | ✅ | ✅ | Absolute float32 XYZ/RGBA; flat extensionless nodes and inline hierarchy |
| 1.4 | ✅ | ✅ | Quantized node-relative XYZ; flat binary nodes and inline hierarchy |
| 1.5–1.8 | ✅ | ✅ binary | Paged HRC hierarchy; binary, LAS or LAZ node payloads |
| 2.0 | ✅ DEFAULT/BROTLI | ✅ DEFAULT | Three-file range-readable octree from PotreeConverter 2.x |

Legacy datasets use `cloud.js` plus individual node resources. Versions 1.5–1.8 add `.hrc`
hierarchy pages and nested node directories. Modern datasets use `metadata.json`,
`hierarchy.bin`, and `octree.bin`; hierarchy entries locate point payloads by byte range and can
refer to additional hierarchy pages.

## Feature support

These symbols describe implemented support within the stated profile; they do not imply
independent certification against every producer or viewer.

| Symbol | Meaning |
| --- | --- |
| ✅ | Supported within the stated profile |
| ⚠️ | Partial support or a version/representation restriction |
| ❌ | Not implemented |
| — | Not applicable |

| Feature | Read | Write | Notes |
| --- | --- | --- | --- |
| Metadata and declared attributes | ✅ | ✅ | One `PotreeLoader` selects the metadata validator from the dataset version |
| Legacy inline hierarchy | ✅ | ✅ | Versions 1.0–1.4; later sources also accept declared inline trees |
| Legacy paged HRC hierarchy | ✅ | ✅ | Versions 1.5–1.8; readers also accept complete trees deeper than the declared page step |
| Modern hierarchy pages and proxies | ✅ | ✅ | 2.0 reader resolves proxies lazily; writer emits a complete hierarchy collection |
| Legacy binary point records | ✅ | ✅ | Attribute layouts depend on the dataset version |
| Legacy LAS/LAZ node payloads | ✅ | ❌ | Reading delegates to LAS/LAZ decoding; dataset output uses binary nodes |
| Modern DEFAULT encoding | ✅ | ✅ | Interleaved little-endian point attributes |
| Modern BROTLI encoding | ✅ | ❌ | Attribute-major payloads with Morton-encoded positions and RGB |
| XYZ coordinate precision | ✅ | ✅ | Early absolute float32, later legacy node-relative uint32, and modern int32 plus axis scale/offset; writers check the declared rounding budget |
| RGB color | ✅ | ✅ | Modern uint16 color is retained; writing uint8 colors to 2.0 multiplies components by 257 |
| RGBA color | ⚠️ | ✅ | Modern DEFAULT retains four components; BROTLI requires RGB, and legacy decoded colors retain the existing RGB output behavior |
| Intensity, classification, and normals | ✅ | ⚠️ | Legacy writers accept declared standard layouts; modern numeric attributes retain their component types |
| Custom numeric attributes | ✅ 2.0 | ✅ 2.0 | All ten scalar types: signed/unsigned 8-, 16-, 32-, and 64-bit integers, float32, and float64 |
| Exact 64-bit attribute values | ✅ 2.0 | ✅ 2.0 | Point values stay exact; JSON min/max statistics can be approximate above Number's exact integer range |
| Custom normalization metadata | ✅ 2.0 | ✅ 2.0 | A loaders.gl metadata extension; independent viewer behavior requires qualification |
| CRS declaration | ✅ | ✅ | Modern native coordinates retain the declaration; writers do not infer or apply a CRS transformation |
| Progressive tile traversal | ✅ | — | One `PotreeSourceLoader` exposes the shared point-cloud tile methods |
| Query scans and Arrow batches | ⚠️ | — | Compatible legacy layouts support `scan()`; modern sources report metadata-only query support |
| Mesh/Arrow dataset authoring | — | ✅ | Accepts a decoded point Mesh, MeshArrowTable, or explicitly owned additive octree nodes |
| Automatic sampling and LOD generation | — | ❌ | Applications supply node ownership; the writer does not sample or duplicate points |
| Out-of-core dataset authoring | — | ❌ | Complete output files and temporary encoding buffers are held in memory |

Modern point decoding returns Float64 XYZ using the declared scale and offset. Legacy source
projection behavior is retained; native modern source coordinates require application placement.
CRS conversion is an explicit application step before writing. See
[Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems).

## Loaders, sources, and writers

- [PotreeLoader](/docs/modules/potree/api-reference/potree-loader) parses metadata for both layouts.
  The package root is metadata-only; direct parser access uses
  `PotreeLoaderWithParser` from `@loaders.gl/potree/potree-loader`.
- [PotreeSourceLoader](/docs/modules/potree/api-reference/potree-source-loader) traverses hierarchy
  and decodes requested point tiles. Pass `cloud.js` for 1.x or `metadata.json` for 2.0;
  directory inputs retain the legacy `cloud.js` default.
- [PotreeWriter](/docs/modules/potree/api-reference/potree-writer) writes a metadata document through
  `encode` or `encodeSync`. `encodePotreeDataset` produces the complete collection of relative
  filenames and typed byte buffers from decoded Mesh/Arrow data.

Modern source tile content uses Mesh Arrow tables. Compatible legacy queries yield ordered Arrow
point batches. The dataset writer accepts decoded, unindexed point data with finite XYZ and
representable numeric attributes; unsupported attributes require an explicit application mapping.

## Resource limits and qualification

Modern sources enforce metadata, aggregate hierarchy, per-tile point, and node limits, and support
cancellation. HTTP servers must honor the requested byte range. The dataset writer defaults to
256 MiB of encoded output and 100,000 input nodes, with explicit precision and cancellation
controls. See the source and writer references for options and defaults.

These limits do not bound total heap: input data, Arrow conversion, temporary buffers, and
application caches consume additional memory. Storage, archive packaging, and downloads are
application responsibilities.

Small deterministic fixtures cover every legacy minor version, modern DEFAULT/BROTLI decoding,
attribute fidelity, malformed inputs, range traversal, and writer round trips. Broader independent
Potree viewer/producer interoperability, peak-memory qualification, modern query scans, BROTLI
output, and out-of-core authoring remain follow-ups.
