---
title: Bring your ArcGIS content
description: Resolve service-backed portal items, preserve metadata, and choose a layer for visualization.
---

import {ClientExample} from '@site/src/components';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';

# Bring your ArcGIS content

Start with an item ID or item-details URL, inspect its service, then explicitly choose a layer or
table. `resolveArcGISItem` preserves publisher metadata without interpreting a Web Map or Web Scene.
The same transport is used for portal, service and selected-layer metadata.

<DocLiveExample label="ArcGIS item explorer" height="760px">
  <ClientExample kind="arcgis-items" />
</DocLiveExample>

The public example needs no account. The **Public examples** dropdown includes Kentucky bicycle routes,
World Imagery, historical US land cover (NLCD 2001), and World Basemap vector tiles. Each entry links
to its ArcGIS source item. Selecting a public example automatically loads its representative layer
or service preview and fits the map to its data. Bicycle routes load when the page opens.
For a custom item, enter any supported item ID or URL, choose **Discover layers**, then use a layer’s
visualization action. For private content, open **Configure sign-in**, supply your
registered OAuth client ID and portal, and register the displayed page URL as a redirect URI.
Enter the exact portal and service origins you trust to receive tokens. Allow the sign-in popup. Sign in, resolve an item,
choose a layer in the collapsible map infobox, then select its visualization action. The example caps queries at 5,000 records and reports partial results.
Feature layers render as interactive deck.gl overlays with feature inspection and fit-to-data controls.
MapServer and ImageServer roots preview imagery, and VectorTileServer roots preview tile geometry
with application styling. Nonspatial tables display their first 50 rows. Scene services expose
metadata and link to the [dedicated scene examples](/examples/arcgis); they are not rendered here.
The optional context map is Esri’s light gray basemap, hosted by an ArcGIS `MapView` with
`@deck.gl/arcgis` `DeckLayer` overlays and native attribution. Reloading the page clears the in-memory session.

## Supported item types

| Portal item type | Expected endpoint | Choices returned | Boundary |
| --- | --- | --- | --- |
| Feature Service | `FeatureServer` or numbered layer | Advertised layers and tables, or the referenced layer | Spatial queries require GeoJSON; no automatic first-layer selection |
| Map Service | `MapServer` or numbered layer | Root image source, layers and tables | Layer queries depend on service capabilities; group layers are not feature layers |
| Image Service | `ImageServer` | Root service | Existing exportImage/LERC paths; no native elevation cache integration |
| Vector Tile Service | `VectorTileServer` | Root service | Tile decoding is separate from cartographic style evaluation |
| Scene Service | `SceneServer` or `SceneServer/layers/{id}` | Advertised scene layers or the referenced layer | I3S version/profile/renderer restrictions still apply |
| Web Map / Web Scene | Document item | Rejected | No document composition, renderer, popup or expression translation |
| CSV, GeoJSON, service definitions, packages, 3D Tiles and other items | File or other endpoint | Rejected | Use the matching file loader or application content client |

These names are portal item types, not every human-facing ArcGIS product label. The resolver does
not search content, fetch `/data`, follow related items, recursively discover scene building
sublayers, rank choices, or guarantee that an advertised layer can be rendered. Unsupported item
types and mismatched endpoint families produce explicit errors.

## Resolve and select

```ts
import {resolveArcGISItem} from '@loaders.gl/arcgis/items';
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';

const itemId = '1bc3536f33374363b828e709b6f73597';
const item = await resolveArcGISItem(itemId);
console.log(item.item.title, item.item.accessInformation, item.layers);

// Let the application/user choose; layer ID 0 belongs to this example item.
const selected = await resolveArcGISItem(itemId, {layerId: 0});
if (!selected.selectedLayer) throw new Error('Select a layer first.');
console.log(selected.selectedLayer.metadata.fields);
const source = await load(selected.selectedLayer.url, ArcGISFeatureServerSourceLoader);
const result = await source.queryFeatures({maxFeatures: 5000});
```

`resolveArcGISItem(input, options)` accepts a 32-character hexadecimal ID, a
`/home/item.html?id=…` URL, or `/sharing/rest/content/items/{id}` URL. Bare IDs default to ArcGIS
Online. Set `portalUrl` to your Enterprise portal root or sharing/rest URL, retaining the web-adaptor
path. An explicit portal must match the portal in an item URL. Credential-bearing item or service
URLs are rejected: supply credentials through the transport.

| Option | Meaning |
| --- | --- |
| `portalUrl` | Portal root or sharing/rest URL; default `https://www.arcgis.com/sharing/rest` for IDs |
| `fetch` | Fetch-compatible transport; use the same authenticated fetch for subsequent source loading |
| `signal` | AbortSignal passed to every metadata request |
| `layerId` | Explicit numeric layer/table ID; `null` selects an available root service; omitted means inspect choices only |

The result contains `portalUrl`, original `item`, original `service` metadata, `layers`, and optional
`selectedLayer` with raw `metadata`. Fields, coded domains, spatial references, copyright, and
service extents remain in their original metadata. Item extent is geographic; service/layer extents
may use a different spatial reference. A title or extent does not establish query or rendering support.
Descriptions and attribution may contain publisher HTML: render as text or sanitize before insertion.

## Private items and deployment verification

Use `ArcGISAuthentication.createFetch()` with an application-managed token callback; see
[ArcGIS authentication](/docs/developer-guide/arcgis/authentication). Pass the returned transport as
`fetch` here and as `core.fetch` to `load`. No discovered item, service or asset URL
expands the credential's allowed origins. Resolving an item does not prove access to all its layers.

| Workflow | Verification in this tranche | Remaining deployment work |
| --- | --- | --- |
| ArcGIS Online public item → FeatureServer → deck.gl | Live public example plus hermetic resolver/query coverage | Public endpoint availability can change |
| OAuth PKCE and token callback | Runnable ArcGIS REST JS example; scoped transport and renewal tested with deterministic responses | Private account sign-in requires a registered client and real account; not verified with a private organization |
| Enterprise portal under a web-adaptor path | URL resolution, metadata and origin handling covered hermetically | Validate your Enterprise release, federation, redirect registration, CORS and identity provider |
| Private tiles and scene resources | Shared transport tests cover token placement/renewal at resource URLs | No new end-to-end private raster or I3S deployment certification |

Source references: Esri's [item resource](https://developers.arcgis.com/rest/users-groups-and-items/item/),
[item types](https://developers.arcgis.com/rest/users-groups-and-items/items-and-item-types/), and
[REST JS browser sign-in tutorial](https://developers.arcgis.com/arcgis-rest-js/authentication/tutorials/sign-in-with-user-authentication-browser/).
