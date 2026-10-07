---
title: WMTS format
description: Request map imagery through advertised tile matrix sets and resource templates.
hide_title: true
page_style: designed
---

import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';
import {ClientExample} from '@site/src/components';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="OGC tiled image service"
  title="WMTS"
  description="WMTS describes discrete tile matrix sets, layers, styles, image formats, and resource templates. The source negotiates those capabilities before requesting visible imagery."
  tone="mint"
  logos={[{alt: 'Open Geospatial Consortium', src: '/images/format-logos/ogc-logo-transparent.png'}]}
  meta={['WMTS 1.0.0', 'Tile matrix sets', 'KVP and REST templates']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'WMS format', to: '/docs/modules/wms/formats/wms'}
  ]}
/>

<DocLiveExample label="WMTS tile service example" height="440px">
  <ClientExample kind="wms" format="WMTS" />
</DocLiveExample>

<WmsDocsTabs active="wmts" />

<DocOrientation
  eyebrow="The tile-service sequence"
  title="Read the capabilities. Choose the matrix. Fetch the tile."
  description="WMTS differs from WMS by making tiling explicit. The client selects an advertised layer, style, format, and matrix set, then requests tiles using the service’s identifiers."
  tone="mint"
  items={[
    {label: 'Discover', value: 'Layers, styles, formats, and matrix sets'},
    {label: 'Select', value: 'A compatible CRS and tile matrix'},
    {label: 'Request', value: 'KVP parameters or REST resource URL'},
    {label: 'Render', value: 'Visible image tiles through TileSource'}
  ]}
/>

WMTS serves map imagery on discrete, advertised tile matrix sets. `WMTSSourceLoader` implements a
loaders.gl `TileSource` and negotiates the layer, style, format, and grid from capabilities.

<ReferenceBoundary
  title="WMTS capabilities and tile requests"
  description="The sections below cover capabilities parsing, matrix selection, request encodings, image formats, CRS metadata, and rendering integration."
  tone="mint"
/>

## Feature support

The adapter derives request configuration from advertised capabilities rather than requiring a
handwritten tile URL. **Supported** describes the service adapter; **Partial** makes rendering or
metadata constraints explicit; **Not implemented** marks features that need additional work.

| Area | Capability | Status | API, guarantee, or boundary |
| --- | --- | --- | --- |
| Discovery | WMTS 1.0.0 capabilities | ✅ Supported | `WMTSCapabilitiesLoader` parses service, layers, styles, resource URLs, and matrix sets |
| Discovery | Supplied capabilities or separate URL | ✅ Supported | `wmts.capabilities` avoids a fetch; `capabilitiesUrl` loads and caches XML |
| Discovery | Dimensions and layer coverage limits | ✅ Supported | Native capabilities retain dimension defaults, current support, values/intervals, and inclusive `TileMatrixLimits` |
| Discovery | Retry after failed capabilities fetch | ✅ Supported | Failed discovery does not poison the cached promise |
| Selection | Layer selection and validation | ✅ Supported | Configured layer or request override; unknown identifiers fail explicitly |
| Selection | Linked tile matrix sets | ✅ Supported | Explicit identifier, first compatible advertised CRS, or first linked set |
| Selection | Reject incompatible requested projection | ✅ Supported | Does not silently substitute a different CRS |
| Selection | Style and image format defaults | ✅ Supported | Advertised default style and first format, with explicit overrides |
| Requests | KVP `GetTile` | ✅ Supported | Standard parameters; existing endpoint parameters survive |
| Requests | REST `ResourceURL` | ✅ Supported | Selects tile templates matching the image format; excludes feature-info resources |
| Requests | URL placeholder expansion | ✅ Supported | Layer, style, matrix set, matrix ID, row, column, and caller parameters are URL encoded |
| Requests | Missing template parameters | ✅ Supported | Unresolved placeholders produce an error |
| Requests | Non-numeric tile matrix identifiers | ✅ Supported | Integer zoom selects the exact numeric identifier or matrix array index; unavailable zooms are not clamped |
| Requests | Reserved request fields | ✅ Supported | Generated layer, style, format, matrix, row, and column fields take precedence over extra parameters |
| Requests | Tile fetch cancellation | ✅ Supported | Tile `AbortSignal` forwarded to fetch; capabilities fetch is not independently canceled |
| Metadata | Layer title, extent, format, CRS | ✅ Supported | Normalized tile-source metadata |
| Metadata | Origin axis normalization | ✅ Supported | EPSG:4326 top-left corners exposed in canonical XY |
| Metadata | Resolution from scale denominator | ✅ Supported | Known geographic/Web Mercator units, or `wmts.metersPerUnit` for projected CRSs; never guessed for unknown units |
| Metadata | Per-level matrix dimensions | ✅ Supported | Advertised sizes retained when complete and aligned with matrix IDs |
| Metadata | Per-level origins and tile dimensions in normalized grid | ✅ Supported | `tileGrid.matrices` carries each level's origin, tile size, matrix size, and resolution; grid-wide fields describe the first level |
| Loading | Image decoding | ✅ Supported | `getTile()` and `getTileData()` decode through the image loader |
| Rendering | Standard deck.gl XYZ grid | ✅ Supported | `SourceLayer` renders a compatible matrix set |
| Rendering | Arbitrary origins, geographic grids, and per-level dimensions | ⚠️ Partial | Application must provide compatible tile selection |
| Rendering | Automatic raster reprojection | ❌ Not implemented | Tiles retain the selected matrix-set projection |
| Limits | Layer-specific tile matrix limits | ✅ Supported | Inclusive row/column bounds; matrices omitted from a limits list are unavailable |
| Limits | Full matrix dimensions | ✅ Supported | Without layer limits, checks zero-based rows/columns against advertised per-level matrix sizes |
| Limits | Coverage query and skipped requests | ✅ Supported | `isTileAvailable()` checks loaded metadata; `getTile()` returns `null` outside coverage without fetching a tile |
| Limits | Invalid indices and malformed bounds | ✅ Supported | Rejects negative, fractional, or unsafe indices and malformed/ambiguous limits; no implicit wrapping |
| Dimensions | Automatic time/elevation/dimension defaults | ✅ Supported | Applies advertised defaults to REST and KVP; explicit `wmts.parameters` and endpoint dimension values take precedence |
| Dimensions | String values, intervals, and current metadata | ✅ Supported | Preserves lexical values such as band `007`; does not expand ranges or guess a current/nearest value |
| Dimensions | Dimension value validation and nearest-time selection | ❌ Not implemented | Service validates supplied values; no interval interpretation, temporal interpolation, or nearest-value selection |
| Queries | WMTS `GetFeatureInfo` REST and KVP | ✅ Supported | `getFeatureInfoURL()`, `getFeatureInfo()`, and `getFeatureInfoText()` query explicit tile/pixel coordinates |
| Queries | Advertised query endpoints and info formats | ✅ Supported | Parses `InfoFormat` and KVP GET bindings; selects matching `FeatureInfo` resources independently of tile templates |
| Queries | Pixel bounds and layer coverage | ✅ Supported | Integer I/J bounded by per-level tile sizes; unavailable tiles skip query fetches |
| Queries | Native JSON, text, XML, and HTML results | ✅ Supported | JSON formats decode to native values; other formats remain unchanged text |
| Queries | HTTP/OWS errors and cancellation | ✅ Supported | Rejects HTTP failures and OWS exception reports, including HTTP 200; forwards query `AbortSignal` |
| Queries | Unified feature schema and coordinate conversion | ❌ Not implemented | No universal service-result normalization or automatic longitude/latitude/screen-to-tile-pixel conversion |
| Transport | SOAP encoding | ❌ Not implemented | KVP and REST tile retrieval are supported |

## Create a tile source

```ts
import {createDataSource} from '@loaders.gl/core';
import {WMTSSourceLoader} from '@loaders.gl/wms';

const source = createDataSource(wmtsUrl, [WMTSSourceLoader], {
  wmts: {
    layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'image/jpeg'
  }
});

const metadata = await source.getMetadata();
const image = await source.getTile({z: 3, x: 2, y: 4});
```

If the service endpoint and capabilities document have different URLs, provide `capabilitiesUrl`
under `wmts`.

## Tile-grid negotiation

WMTS matrix sets may use provider-specific identifiers, origins, resolutions, and limits. The source
exposes the advertised grid metadata. Applications can select a linked matrix set explicitly,
request a compatible CRS, or use the first linked set. Rendering still requires tile selection
compatible with that grid; see the boundaries below.

`tileGrid.matrices` describes every level separately, because some matrix sets change origin or
tile size between levels. A scale denominator becomes a resolution only when the CRS unit is known.
EPSG:4326, CRS:84, and Web Mercator are built in; for a projected CRS, supply the unit length:

```ts
const source = createDataSource(wmtsUrl, [WMTSSourceLoader], {
  // A UTM matrix set: one CRS unit is one meter.
  wmts: {layer: 'orthophoto', tileMatrixSet: 'utm18n', metersPerUnit: 1}
});

const {tileGrid} = await source.getMetadata();
// tileGrid.matrices[i]: {id, resolution, origin, tileSize, matrixSize}
```

## deck.gl integration

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {WMTSSourceLoader} from '@loaders.gl/wms';

const layer = new SourceLayer({
  id: 'satellite-imagery',
  data: wmtsUrl,
  loaders: [WMTSSourceLoader],
  sourceOptions: {
    wmts: {layer: layerId, tileMatrixSet: matrixSetId}
  }
});
```

## References

- [OGC Web Map Tile Service standard](https://www.ogc.org/standard/wmts/)

## Configure from capabilities

```ts
const source = createDataSource(wmtsUrl, [WMTSSourceLoader], {
  wmts: {
    capabilitiesUrl,
    layer: 'imagery',
    crs: 'EPSG:3857'
  }
});
const metadata = await source.getMetadata();
const tileUrl = source.getTileURL({x: 0, y: 0, z: 0});
```

A parsed `wmts.capabilities` document can also be supplied and is available immediately to
`getTileURL()`. When using `capabilitiesUrl`, await `getMetadata()` first; `getTile()` loads
capabilities automatically. Failed capability requests can be retried.

The source selects the first advertised format and default style unless overridden, uses tile
resources (excluding feature-info templates), and expands `{Style}`, `{Layer}`, and matrix
placeholders with URL encoding. Advertised dimension defaults fill dimension placeholders automatically. Additional placeholders
must be supplied in `wmts.parameters`; unresolved placeholders throw. KVP requests preserve endpoint parameters.
Unknown layers, unlinked matrix sets, and explicitly requested CRSs without a compatible linked
matrix set fail instead of silently requesting another projection.

`tileGrid.origin` is XY (including EPSG:4326 axis normalization). `tileGrid.resolutions` contains
coordinate units per pixel derived from OGC scale denominators for Web Mercator and geographic
CRSs. For unknown CRS units or incomplete scale metadata, resolutions are omitted. Matrix sizes
are omitted if incomplete, preserving alignment with matrix IDs.

These metadata do not reproject image tiles or make arbitrary grids compatible with deck.gl's
standard XYZ tile selection. Custom origins, per-level tile dimensions, and geographic grids require an application tile-selection adapter. Layer limits are enforced before
tile retrieval, but do not change the rendering grid. Choose an XYZ-compatible matrix set for the
standard deck.gl tile path.

`getTileURL({x, y, z, layers})` and `getTile({x, y, z, layers})` can override the configured layer for one request. With capabilities, the requested layer supplies its REST resource, default format and style, and linked tile matrix set. Unknown layer identifiers are rejected. WMTS requests select one layer at a time.

## Coverage limits and dimensions

The source uses the selected layer's `TileMatrixSetLink` limits for both KVP and REST requests.
Row and column bounds are inclusive. If a limits list is present, a matrix without an entry is
unavailable; an explicitly empty list permits no tiles. Without layer limits, full matrix sizes
constrain each level independently. Incomplete matrix size metadata is not extrapolated.
Malformed limits (missing/duplicate identifiers, negative or noninteger indices, reversed bounds,
or limits exceeding the selected matrix's dimensions) fail explicitly.

```ts
import {WMTSImageTileSource} from '@loaders.gl/wms';

const source = new WMTSImageTileSource(wmtsUrl, {
  wmts: {
    capabilitiesUrl,
    layer: 'imagery',
    // Optional: overrides the advertised Time default without guessing a range member.
    parameters: {Time: '2026-09-01T00:00:00Z'}
  }
});
await source.getMetadata();
const tile = {x: 2, y: 1, z: 3};
if (source.isTileAvailable(tile)) {
  const tileUrl = source.getTileURL(tile);
  const image = await source.getTile(tile);
}
```

`isTileAvailable()` checks advertised coverage, not whether the server actually has a tile. Load
URL-based capabilities with `getMetadata()` before synchronous coverage or URL queries; supplied
capabilities are available immediately. With no capabilities, coverage is unknown and valid
indices are allowed. Async `getTile()` loads capabilities itself and returns `null` outside coverage
without a tile fetch. `getTileData()` has the same behavior. `getTileURL()` throws a `RangeError`
for an unavailable tile. All three reject negative, fractional, nonfinite, or unsafe indices;
tiles never wrap implicitly, and unavailable zooms are not rounded or clamped to another matrix.
An exact numeric advertised matrix identifier takes precedence over the matrix array index.

Native `WMTSLayer.dimensions` exposes identifiers, titles, units, defaults, current support, and
unexpanded values/intervals. Dimension values remain strings: `0`, `007`, and ISO8601 intervals
retain their original representation. Selection uses the following precedence:

1. A dimension value in `wmts.parameters`.
2. A dimension value in the source endpoint's query string.
3. The dimension's advertised default.

Request parameter names are matched without regard to case. A missing or empty dimension value
with no advertised default requires an explicit caller value; the source never chooses the first
range member, a nearest time, or `current` solely because current support is advertised. The server
validates explicit values. Defaults and overrides fill REST placeholders with URL encoding and
are sent once in KVP queries. Per-request layer overrides select that layer's dimensions and limits.
Generated GetTile fields remain authoritative: extra parameters cannot override the validated
matrix, row, column, selected layer, style, or format.

These rules follow the [WMTS 1.0.0 service metadata and GetTile definitions](https://docs.ogc.org/is/07-057r7/07-057r7.pdf).
They do not add raster reprojection, arbitrary-grid rendering, interval expansion, or automatic tile-pixel
selection; those remaining boundaries are marked in the support table above.

## Feature information

Feature information is a server query for a pixel within a WMTS tile. It can inspect a tile that is
not currently rendered. Applications supply tile indices and zero-based pixel coordinates; these
are distinct from deck.gl picking coordinates and from longitude/latitude.

```ts
const source = new WMTSImageTileSource(wmtsUrl, {
  wmts: {capabilitiesUrl, layer: 'imagery'}
});
const result = await source.getFeatureInfo({
  x: 2, y: 1, z: 3,
  pixelColumn: 132, // OGC I: column within the tile
  pixelRow: 86     // OGC J: row within the tile
});
// JSON info formats return the service's native object (for example, GeoJSON).
// Non-JSON formats return their original text. Unavailable tiles return null.
```

| API or option | Behavior |
| --- | --- |
| `getFeatureInfoURL(parameters)` | Builds a URL synchronously; load URL-based capabilities first |
| `getFeatureInfo(parameters, signal?)` | Loads capabilities, then returns native JSON for `application/json` or `+json` MIME types, otherwise text |
| `getFeatureInfoText(parameters, signal?)` | Same request and error handling, preserving the raw response text even for JSON |
| `WMTSGetFeatureInfoParameters` | Tile `{x, y, z, layers?, format?, signal?}`, plus `pixelColumn`, `pixelRow`, and optional `infoFormat` |
| `wmts.infoFormat` | Default query format, overridden by per-request `infoFormat`; otherwise use the first advertised info format or feature-info resource format |
| `wmts.featureInfoUrlTemplate` | Explicit REST query template, independent of `wmts.urlTemplate` for tiles |
| `wmts.featureInfoUrl` | Explicit KVP query endpoint, overriding the advertised GET endpoint |

The source selects a `ResourceURL` with `resourceType="FeatureInfo"` matching the info format.
It never uses a tile resource as a query template. REST placeholders include `{I}`, `{J}`,
`{InfoFormat}`, and the same layer/style/matrix/dimension placeholders used by tile requests.
Relative templates and query endpoints resolve against the source URL. Template values are URL
encoded; placeholder and KVP names are matched without regard to case.

Without a matching REST template, queries use an explicitly configured KVP endpoint, then the
advertised KVP GET endpoint. When operation metadata is absent, the source endpoint is the legacy
fallback. Metadata that explicitly lacks a supported KVP query binding requires a REST template or
an explicit endpoint instead of silently treating a REST/SOAP binding as KVP. Selected endpoint
query parameters are retained; query parameters from a different tile endpoint are not copied.
Shared fetch/authentication options remain available.

KVP queries carry the tile's `FORMAT`, layer, style, matrix set, matrix identifier, row/column, and
selected dimension values, plus `INFOFORMAT`, `I`, and `J`. Dimension precedence is identical to
tile retrieval. Generated fields override extra parameters so query coordinates and formats stay
authoritative. A format outside a nonempty advertised info-format list is rejected. When no info
format is advertised, an explicit format is required.

Pixel indices must be nonnegative safe integers. Advertised per-level tile width/height bound
pixels to `0..width-1` and `0..height-1`; missing sizes are unknown and are not guessed. Negative,
fractional, nonfinite, or unsafe indices fail before discovery. Advertised pixel bounds are checked
after metadata loads and before a feature-info request. `getFeatureInfoURL()` throws for unavailable tiles;
async queries return `null` without a feature-info fetch. The optional signal argument overrides
`parameters.signal`; capability discovery uses its shared cached request and is not separately
canceled.

HTTP failures and OWS `ExceptionReport` bodies reject, including reports returned with HTTP 200.
`getFeatureInfo()` rejects malformed JSON; `getFeatureInfoText()` preserves it for caller inspection.
XML/GML and HTML are returned as text: this adapter does not infer a universal feature schema,
reproject returned geometry, convert results to Arrow/binary tables, or perform local spatial
predicates. Use feature sources and [spatial query integration](../../../developer-guide/spatial-queries)
for selection, snapping, and analysis across feature data.

Request fields and pixel bounds follow the [WMTS 1.0.0 GetFeatureInfo definitions](https://docs.ogc.org/is/07-057r7/07-057r7.pdf).
