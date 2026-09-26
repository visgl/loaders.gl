# ArcGIS services: implementation inventory and documentation requirements

Planning inventory, reviewed 2026-09-26. Companion to the [ArcGIS module RFC](arcgis-module-rfc.md).
This inventory was recorded before extraction from `@loaders.gl/services`. The adapters now live in
`@loaders.gl/arcgis`; see the maintained [public support table](../../../docs/modules/arcgis/services.md).
This planning snapshot describes inspected source, not a published release certification.

## How to read the tables

| Status | Meaning |
| --- | --- |
| Implemented subset | A dedicated adapter implements the named operations; other operations remain unsupported |
| Partial / verify | Related code exists, but the complete workflow or stated variation needs validation |
| Other package | A relevant format/protocol implementation exists elsewhere; ArcGIS deployment compatibility is not thereby established |
| Not implemented | No dedicated service client or end-to-end workflow was found in the inspected source |

“Planned” is a roadmap label, never a current support status. A JSON request, a URL detector,
generic credential helper, or ability to decode one returned file is not service integration.
Discovery listing an unknown service is not support for consuming it.

This is a broad inventory of service families and important operations, not a promise to wrap every
Esri API. It deliberately includes gaps. ArcGIS products, portal item types, service types, and
transport formats are different things; the tables keep those distinctions visible. References
include Esri's [service catalog](https://developers.arcgis.com/rest/services-reference/enterprise/catalog/),
[REST API overview](https://developers.arcgis.com/rest/), and
[item types](https://developers.arcgis.com/rest/users-groups-and-items/items-and-item-types/).

## Data access, maps, imagery, and 3D

| Service / operation | Endpoint or resource | Current status | What exists | Important gaps and limits |
| --- | --- | --- | --- | --- |
| Feature service: layer reads | `FeatureServer/{layerId}/query` | Implemented subset | Metadata/schema; one spatial/attribute query; GeoJSON, binary, or Arrow conversion [F] | No automatic paging/completeness contract; limited field mapping; parser requires GeoJSON even though options allow JSON |
| Feature service: root and layers | `FeatureServer`, `FeatureServer/{layerId}` | Partial / verify | Root/layer metadata and explicit layer selection [F] | Root URL does not automatically choose a layer; root query is not equivalent to layer query |
| Feature service: nonspatial tables | `FeatureServer/{tableId}` | Partial / verify | Shares endpoint conventions with feature layers | No dedicated nonspatial table contract or verified JSON record conversion; do not advertise table support yet |
| Feature service: statistics and advanced queries | Layer `query`, related-record and attachment operations | Not implemented | Basic filtering is available through the feature source [F] | No first-class counts/IDs-only, grouped statistics, related records, attachment browsing, or full temporal-query API |
| Feature service: edits, replicas and synchronization | Feature service editing/sync operations | Not implemented | No editing or offline synchronization client | Explicitly outside the initial read-only visualization scope |
| Map service: cached image tiles | `MapServer/tile/{level}/{row}/{column}` | Implemented subset | Tile metadata and image fetching [M] | Validate grid/CRS compatibility; no cache download/export workflow |
| Map service: dynamic image export | `MapServer/export` | Implemented subset | Export images per Web Mercator tile; update request parameters [M] | Not the full map-service API; projection/grid constraints apply |
| Map service: feature queries, identify, find and legend | `MapServer/{layerId}/query`, `identify`, `find`, `legend` | Not implemented | Existing MapServer source handles imagery [M] | Cannot treat MapServer vector data as supported just because the service displays as an image |
| Image service: viewport export | `ImageServer/exportImage` | Implemented subset | Rendered images; output bounds/CRS; rendering/mosaic rules [I] | No full catalog, identify, pixel sampling, multidimensional, or download API |
| Image service: exported image tiles | `ImageServer/exportImage` for each requested tile | Implemented subset | PNG or LERC exports using Web Mercator tile bounds [IT] | These are dynamically exported tiles, not native cached ImageServer tile requests |
| Image service: numerical raster export | `ImageServer/exportImage` with LERC | Implemented subset | Decoded bands, mask and raster metadata via LERC [I], [IT] | Application chooses how to visualize values; band/rule passthrough does not imply complete analytical service support |
| Image service: native cached imagery/elevation tiles | `ImageServer/tile/...` | Not implemented | Image and LERC decoders provide building blocks | Current ArcGIS image tile adapter uses `exportImage`; no dedicated cache traversal/sampling/terrain integration |
| Vector tile service: tile data | `VectorTileServer/tile/...` | Implemented subset | Metadata, raw PBF and decoded MVT; WGS84 features [V] | No guaranteed arbitrary tile-grid support; publishing/export administration absent |
| Vector tile service: cartographic styling | Style JSON, sprites and glyph resources | Partial / verify | Style/sprite URLs exposed as metadata [V] | No full style evaluation, font/glyph loading, sprite rendering, label placement, or automatic style-to-deck.gl translation |
| Scene service: 3D object / mesh data | `SceneServer/layers/{layerId}` | Implemented subset | Metadata and delegated I3S source [S] | Validate each version/profile, geometry and texture encoding, CRS and renderer route separately |
| Scene service: integrated mesh | I3S integrated mesh profile | Partial / verify | Mesh-related I3S infrastructure and WebScene layer recognition [S], [W] | Do not infer complete IntegratedMesh conformance from 3DObject support; require a representative fixture and demo |
| Scene service: points | I3S Point profile | Implemented subset | Point metadata and delegated source [S] | Version-specific limits; renderer metadata preservation is not symbol evaluation |
| Scene service: point clouds | I3S PointCloud profile | Implemented subset | Dedicated point-cloud source and LEPCC infrastructure [S] | Attribute support is partial; profile/version and renderer checks still required |
| Scene service: building scenes | Building profile and sublayers | Other package / partial | `I3SBuildingSceneLayerLoader` and building examples in I3S [B] | Not evidence that the general SceneServer facade fully handles building roots, filters, categories, and all sublayers |
| Scene service: feature query | Layer `query` | Implemented subset | Query parameter forwarding, transfer-limit metadata, raw response [S] | Availability depends on published service; no automatic paging; local scene aggregation is not server-side statistics |
| ArcGIS-hosted 3D Tiles | Root `tileset.json` and child content | Other package / verify | Generic `@loaders.gl/3d-tiles` and tiles runtime | ArcGIS item resolution, authentication propagation, extensions and deployment need validation; not the I3S SceneServer adapter |
| Stream service | `StreamServer` and WebSocket subscription | Not implemented | No ArcGIS stream client | Subscription, filters, reconnect, bounded retention and incremental layer updates are gaps |
| Video service | `VideoServer` resources | Not implemented | Generic video-related code is not this client | No service discovery, playback-session, frame/footprint synchronization, or ArcGIS video metadata integration |
| Knowledge graph service | `KnowledgeGraphServer` | Not implemented | Generic graph/file support is not this client | No graph query protocol, data model, PBF response handling or spatial-entity conversion |

The operation distinctions above are grounded in Esri's
[feature query reference](https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/)
and [map service reference](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/).
Specialized families are documented separately:
[stream services](https://developers.arcgis.com/rest/services-reference/enterprise/stream-service/),
[video services](https://developers.arcgis.com/rest/enterprise-administration/video-server/services/),
[knowledge graphs](https://developers.arcgis.com/rest/services-reference/enterprise/kgs-hosted-server/),
and [ArcGIS 3D Tiles layers](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-IntegratedMesh3DTilesLayer.html).

## Basemaps and location services

These public service families are listed in Esri's
[mapping and location services guide](https://developers.arcgis.com/documentation/mapping-and-location-services/).
Consuming MapServer or VectorTileServer data does not imply support for their higher-level APIs.

| Service | Purpose | Current status | Useful existing foundation | Missing integration |
| --- | --- | --- | --- | --- |
| Basemap Styles service | Select styled basemaps | Not implemented | Vector/raster tile data adapters | Style catalog, style resolution, sessions where applicable, resources, attribution workflow and renderer integration |
| Static Basemap Tiles service | Request styled basemap tiles | Not implemented | Generic image and tile handling | Service-specific URL/options, authentication/session behavior and attribution |
| Static Maps service | Request a map image | Not implemented | Image decoding | Service request construction, overlay parameters and attribution |
| Geocoding service | Address search, suggestions, reverse and batch geocoding | Not implemented | Result geometry can be passed to a visualization after application conversion | No locator client or ArcGIS response adapter |
| Places service | Place search and details | Not implemented | Application can visualize converted results | No search, pagination, details or category client |
| Routing service | Routes and network analysis | Not implemented | Application can visualize converted route geometry | No solve client, directions, service-area, closest-facility or advanced routing workflow |
| GeoEnrichment service | Demographic and contextual attributes | Not implemented | Table processing after external retrieval | No data-collection discovery, study-area enrichment or response normalization |
| Elevation service | Point and multipoint elevation | Not implemented | Raster decoders are separate functionality | No endpoint client; LERC support is not point-elevation service support |

The [Static Maps API](https://developers.arcgis.com/rest/static-maps/) and
[Elevation API](https://developers.arcgis.com/rest/elevation/) are distinct services, not alternate
names for MapServer image exports or ImageServer raster decoding. Use Esri APIs or an application
client for these gaps; describe such examples as external-client recipes rather than module support.

## Analysis and computation

| Service family | Typical API | Current status | Scope boundary |
| --- | --- | --- | --- |
| Geometry service | `GeometryServer` | Not implemented | No remote projection, buffer, simplify or spatial-relation client; local geometry helpers do not count |
| Geoprocessing / web tools | `GPServer` tasks | Not implemented | No execute/submit-job, polling, cancellation or output retrieval workflow |
| Spatial / feature analysis | Analysis tools | Not implemented | No server-side analysis client; reading a resulting FeatureServer is separate |
| Raster analysis | Raster analysis tools | Not implemented | Raster decoding and rendering rules are not job submission or result management |
| GeoAnalytics | GeoAnalytics tools | Not implemented | No analysis orchestration or job/result client |
| Elevation and hydrology analysis | Terrain analysis tools | Not implemented | Separate from point elevation and raster loading |
| Network analysis on Enterprise | `NAServer` layers | Not implemented | No network solver client |
| Printing and map export tasks | Printing tools, commonly GP tasks | Not implemented | No web-map print specification, layout selection or job client |
| Orthomapping / raster utilities | Specialized processing APIs | Not implemented | No processing workflow; consume supported output services separately |

References: [geometry](https://developers.arcgis.com/rest/services-reference/enterprise/geometry-service/),
[geoprocessing](https://developers.arcgis.com/rest/services-reference/enterprise/gp-overview/),
[spatial analysis](https://developers.arcgis.com/rest/analysis/),
[raster analysis](https://developers.arcgis.com/rest/services-reference/enterprise/get-started-with-the-raster-analysis-service/),
and [network analysis](https://developers.arcgis.com/rest/services-reference/enterprise/network-service/).
The other named families appear in the [service hierarchy](https://developers.arcgis.com/rest/services-reference/enterprise/resource-hierarchy-services/)
and [REST overview](https://developers.arcgis.com/rest/).

## Specialized Enterprise services

These families belong in the inventory so users can identify a real gap. Their inclusion is not a
proposal to implement full enterprise GIS management in loaders.gl.

| Service family | Current status | Visualization-related boundary |
| --- | --- | --- |
| Utility Network | Not implemented | Querying associated features is not network tracing or topology support |
| Trace Network | Not implemented | No trace client or trace-result normalization |
| Network Diagram | Not implemented | No diagram retrieval/layout client |
| Parcel Fabric | Not implemented | Ordinary feature reads do not implement parcel workflows |
| Version Management | Not implemented | No branch-version/session management |
| Validation | Not implemented | No validation or geodatabase-rule workflow |
| Linear Referencing | Not implemented | No route-measure/event operations |
| GeoData | Not implemented | No geodatabase replica/version client |
| Relational Catalog / Big Data Catalog | Not implemented | Directory discovery does not implement these catalogs |
| Maritime Chart / Topographic Production | Not implemented | No specialized chart or production APIs |
| Symbol service | Not implemented | Symbol metadata preservation is not symbol generation or rendering |
| Schematic / Globe / Mobile services | Not implemented | Listed for recognition; no dedicated clients |

References: [utility network](https://developers.arcgis.com/rest/services-reference/enterprise/utility-network-service/),
[trace network](https://developers.arcgis.com/rest/services-reference/enterprise/trace-network-service/),
[associated enterprise services](https://developers.arcgis.com/rest/services-reference/enterprise/overview-of-utility-network-services/),
[GeoData](https://developers.arcgis.com/rest/services-reference/enterprise/geodata-service/), and
[service hierarchy](https://developers.arcgis.com/rest/services-reference/enterprise/resource-hierarchy-services/).

## Content, discovery, documents, and administration

These are adjacent resources/workflows, not all distinct service types.

| Resource / workflow | Current status | What exists | Gap |
| --- | --- | --- | --- |
| REST service directory | Implemented subset | Recursive directory enumeration and capability inspection [D] | No unified credential option; URL-token preservation and error/partial-result handling need improvement |
| Service selection | Implemented subset | First matching capability entry [D] | No ranking; discovery is not a guarantee that a source or renderer supports the result |
| Portal search and item resolution | Not implemented | Existing examples accept service URLs | No general item-ID/item-page-to-service resolver or search client |
| WebMap | Not implemented | Individual data sources can be consumed | No web-map document composition, style, popup or expression implementation |
| WebScene | Other package / partial | I3S WebScene loader handles selected operational layer types [W] | Current parser checks WKID 4326; unsupported layers are reported; not a complete scene renderer |
| Offline packaging and service export | Not implemented | File-format loaders can parse some independently obtained outputs | No package-generation, download, replica or synchronization workflow |
| Sharing, publishing, users, groups and content management | Not implemented | None in the ArcGIS adapters | Use portal/content APIs outside this module |
| Server / portal / notebook / mission / video administration | Not implemented | None in the ArcGIS adapters | No infrastructure or administrative client |

See Esri's [item model](https://developers.arcgis.com/rest/users-groups-and-items/items-and-item-types/)
and [API overview](https://developers.arcgis.com/rest/). A future item resolver should initially
handle a named subset of layer item types; it must not imply arbitrary WebMap/WebScene rendering.

## Open protocols and files available from ArcGIS

| Interface or format | Current status | Relevant package | What must not be inferred |
| --- | --- | --- | --- |
| WMS | Other package | `@loaders.gl/wms` | Generic protocol support does not certify every ArcGIS WMS configuration |
| WMTS | Other package | `@loaders.gl/wms` | Validate tile matrix, CRS and authentication for the actual deployment |
| WFS | Other package | `@loaders.gl/wms` | Version and geometry/CRS limits apply; no ArcGIS transaction guarantee |
| WCS | Other package | `@loaders.gl/wms` | Coverage access differs from ImageServer REST support |
| OGC API Features / Tiles | Other package | `@loaders.gl/wms` | Protocol implementation does not establish ArcGIS publishing or deployment support |
| KML, GeoJSON, CSV, GeoTIFF, Shapefile and similar exports | Other package | Format-specific packages | Parsing an existing file does not perform the ArcGIS export job |
| SLPK | Other package | `@loaders.gl/i3s` | Archive/profile coverage differs from online SceneServer support |
| TPK/TPKX, VTPK, mobile map/scene packages | Not verified | ZIP/container utilities are only building blocks | Do not advertise package readers without format-specific implementations and tests |

The protocol list is an alternative integration route, not a claim that every ArcGIS product
publishes every listed protocol. See the current [WMS package exports][O] for actual APIs.

## Priorities derived from the gaps

1. **Initial release:** move and validate the existing adapters; fix FeatureServer completeness,
   response formats and authentication errors; make each supported path demonstrable. Publish
   service/operation limitations alongside the examples.
2. **Highest-value follow-ups:** MapServer feature querying, portal layer-item resolution,
   nonspatial tables, counts/statistics and attachment/related-record access. These directly help
   developers visualize data already in ArcGIS. Select and scope these separately from extraction.
3. **Evaluate with use cases:** native ImageServer/elevation tiles, basemap service recipes,
   real-time StreamServer, and ArcGIS-hosted 3D Tiles integration. Each requires its own data,
   authentication and renderer validation.
4. **Integrate externally first:** geocoding, routing, places, enrichment and analysis. Show how
   externally obtained results become visualization data before considering dedicated clients.
5. **Keep outside initial scope:** editing/synchronization, enterprise domain workflows, publishing
   and administration. Continue listing these gaps so users do not mistake absence for omission.

Priorities are recommendations for planning, not committed release features.

## Evidence and maintenance

For the published guide, every supported operation needs links to its API reference, owning
implementation, focused conformance test and runnable example. Track the first released package
version, last external verification date, tested ArcGIS product/version, authentication mode and
renderer separately. Use “not verified” when evidence is absent.

Build the guide table, module summary and example badges from one authored inventory so their
claims stay aligned. Keep implementation status separate from roadmap priority. Do not use one
green check mark for decoding, service access and rendering. This planning document is the seed
for that inventory, not a requirement to create duplicate public tables manually.

[F]: ../../../modules/arcgis/src/arcgis/arcgis-feature-server-source.ts
[M]: ../../../modules/arcgis/src/arcgis/arcgis-map-tile-source.ts
[I]: ../../../modules/arcgis/src/arcgis/arcgis-image-server-source.ts
[IT]: ../../../modules/arcgis/src/arcgis/arcgis-image-tile-source.ts
[V]: ../../../modules/arcgis/src/arcgis/arcgis-vector-tile-server-source.ts
[S]: ../../../modules/arcgis/src/arcgis/arcgis-scene-server-source.ts
[D]: ../../../modules/arcgis/src/arcgis/arcgis-capability-graph.ts
[W]: ../../../modules/i3s/src/lib/parsers/parse-arcgis-webscene.ts
[O]: ../../../modules/wms/src/index.ts

[B]: ../../../modules/i3s/src/index.ts
