# ArcGIS module and developer guide

Status: Initial implementation in progress. The dedicated package, lazy entry points, guide,
service inventory and embedded examples are implemented in this change. Automatic feature paging,
normalized ArcGIS error envelopes and richer query APIs remain follow-up work. This document
records the broader plan; it does not announce released support.

## Goals

Make `@loaders.gl/arcgis` the clear entry point for developers who have data in ArcGIS and want
to build geospatial visualization applications with deck.gl. ArcGIS continues to host and manage
their data; loaders.gl supplies data access and decoding; deck.gl supplies visualization.

Deliver the package and an application-oriented developer guide together. A developer should be
able to find a service URL, choose an authentication method, inspect capabilities, fetch an
appropriate amount of data, and display it without learning the internal source architecture first.

Move existing implementations rather than duplicating them. Compatibility paths are not a goal:
update repository callers, tests, examples, and documentation directly. Do not add deprecated
aliases, forwarding packages, or compatibility exports by default.

## Existing foundation and gaps

Before extraction, the checkout contained six ArcGIS source loaders in `modules/services/src/arcgis`, a service
registry, discovery helpers, scene aggregation, and `createArcGISCredential`. Existing service
guides lived in `docs/modules/services`. These are implementation and documentation foundations,
not evidence that every capability is published or verified against every ArcGIS deployment.

Specific findings that shape this plan:

- FeatureServer `getFeatures()` performs one query and converts a GeoJSON FeatureCollection into
  GeoJSON, binary, or Arrow data. Pagination is not automatic. Its options allow JSON response
  formats that its parser does not currently accept; the new API must resolve that mismatch.
- FeatureServer response checking primarily checks HTTP status. Preserve ArcGIS JSON error
  details rather than reporting a generic invalid-feature response.
- `createArcGISCredential` already uses exact-origin scoping and accepts static tokens or token
  callbacks. The shared refresh logic checks HTTP status; ArcGIS errors inside successful HTTP
  JSON responses need explicit handling and tests.
- Discovery accepts a custom fetch function, but is not yet presented through the same credential
  configuration as source loading. Service selection returns the first match, not a ranked result.
- Vector tile styles are discoverable metadata, not a complete deck.gl style implementation.
- SceneServer delegates decoding and traversal to existing I3S sources. Source support and renderer
  support must be documented separately, by profile.
- `load()` already resolves source-loader `preload()`. `createDataSource()` is synchronous and
  requires a runtime source loader. The lightweight Arrow table tile source in `@loaders.gl/mvt`
  provides a useful source-specific precedent in addition to the CSV loader structure.

## Package ownership and public API

| Area | Owning package after the move | Decision |
| --- | --- | --- |
| ArcGIS REST sources, discovery, query helpers, credentials | `@loaders.gl/arcgis` | Move from services; one implementation owner |
| Generic fetch, credential pipeline, source contracts | `@loaders.gl/loader-utils` | Reuse; keep provider-independent |
| Mapbox, Google Maps, Cesium credential presets | `@loaders.gl/services` | Retain for now; clarify its reduced scope |
| I3S, SLPK and existing WebScene parsing | `@loaders.gl/i3s` | Keep format ownership; link from the ArcGIS guide |
| MVT, LERC and image decoding | Existing format packages | Reuse through implementation entry points |
| Minimal geometry construction, including WKB Arrow geometry | `@loaders.gl/gis` | Use existing lightweight helpers |
| Rich geospatial table processing | `@loaders.gl/geoarrow` | Optional application dependency |
| deck.gl source adapters and rendering | `@loaders.gl/deck-layers` | Integrate through generic source contracts |
| OGC services exposed by ArcGIS deployments | `@loaders.gl/wms` | Link to the protocol guide; do not duplicate clients |

Proposed exports:

- Root: the six existing `ArcGIS*SourceLoader` descriptors, shared public types, and a descriptive
  `ARCGIS_LOADERS` registry. Preserve useful existing loader and class names; set module metadata
  to `arcgis`. Avoid incidental API renaming during the move.
- `@loaders.gl/arcgis/authentication`: `createArcGISCredential` and its options.
- `@loaders.gl/arcgis/discovery`: `getArcGISServices`, `discoverArcGISCapabilities`,
  `selectArcGISService`, and their public types.
- Explicit per-source subpaths such as `@loaders.gl/arcgis/arcgis-feature-server-source-loader`:
  runtime source classes and `*WithParser` loader exports, following repository loader conventions.
- `@loaders.gl/arcgis/scene-aggregation`: existing scene feature aggregation helpers.

Keep the root metadata-only. Each descriptor lives in its own `*-loader-types.ts`, uses a static
package-subpath import in `preload()`, and shares neutral types/defaults with the implementation.
As required by the existing `SourceLoader` contract, metadata descriptors may contain a
`createDataSource` guard that explains the async or explicit-subpath alternatives; they must not
eagerly import runtime implementations. Do not create `bundled`/`unbundled` aliases without a need.

The recommended application path is asynchronous `load()` with the root descriptor. Applications
needing synchronous source construction import a runtime loader from its explicit subpath and
pass it to `createDataSource()`. Verify that `SourceLayer` honors lazy descriptors before documenting
registry-based layer construction. Keep heavy I3S and raster dependencies out of feature-only
import graphs, and measure this with a bundle/import smoke check.

Published implementation code must not import `@loaders.gl/core`; use injected `CoreAPI` or shared
lower-level helpers. Application examples may import core. Keep deck.gl and ArcGIS Maps SDKs out
of mandatory module dependencies.

## Service support matrix

Use the companion [ArcGIS service inventory](arcgis-service-inventory.md) as the detailed baseline.
It covers data services and operations, basemaps/location services, analysis, specialized Enterprise
services, portal/document workflows, and alternate open protocols. Keep the complete inventory
accessible from the main guide, with an implemented-services filter for readers seeking a quick start.

The guide must distinguish implementation present in this checkout, verified release support,
and planned additions. The inventory uses “implemented subset,” “partial / verify,” “other package,”
and “not implemented.” Published “supported” claims require operation-specific conformance
evidence; they do not mean full ArcGIS service parity or Esri product support.

The main gaps to make conspicuous are FeatureServer paging and advanced queries, MapServer
feature querying, native cached ImageServer tiles, full vector-tile styling, portal item resolution,
and profile-specific scene rendering. Generic parsing, token transport, or raw REST requests must
not turn an unsupported service into a supported row.

Each service page should additionally include an operation table with endpoint, method, request
options, response formats, normalized output, authentication propagation, cancellation, paging,
coordinate handling, and known limits. Keep host compatibility separate: ArcGIS Online,
ArcGIS Location Platform, and ArcGIS Enterprise are deployment/product contexts, not identical
capability sets. List only tested Enterprise versions and configurations, with verification dates.

## Authentication design and guide

Keep token acquisition and session management in the application or an established Esri library.
The module accepts credentials and applies them to service requests. Do not implement a new OAuth
client, login UI, password storage, or token persistence layer.

| Application scenario | Authentication approach | loaders.gl integration | Guide must explain |
| --- | --- | --- | --- |
| Publicly accessible data | Anonymous | No credential | Public sharing does not imply every related resource is public |
| Public application using permitted ArcGIS resources | API key where the service and account permit it | Pass the key as a scoped token | Privileges, restrictions, account/service eligibility, and browser visibility |
| User accessing organization content | OAuth user authentication; authorization code with PKCE | Session library supplies a token callback | App registration, portal URL, redirect URI, renewal, logout, denied access |
| Backend or scheduled processing | App authentication where applicable | Backend supplies a short-lived token | Client secrets stay on the backend; do not embed them in browser examples |
| Enterprise or federated deployment | Deployment-specific user/session authentication | Correctly scoped token provider or custom fetch | Portal and server origins can differ; tokens may require server-specific handling |
| Existing application session or gateway | Existing identity integration | `core.fetch`, request credentials, or configured cookie transport | CORS, cookie policy, explicit trusted origins, and proxy behavior |

Esri documents the authentication categories and recommends PKCE for user authentication. Link
to its current guidance rather than maintaining our own account eligibility or pricing tables:
[authentication types](https://developers.arcgis.com/documentation/security-and-authentication/types-of-authentication/)
and [user authentication flows](https://developers.arcgis.com/documentation/security-and-authentication/user-authentication/flows/).

The guide needs complete recipes for an anonymous request, an API key, a refreshing user session,
and Enterprise custom transport. Provide optional, tested integrations with ArcGIS REST JS and
an existing ArcGIS Maps SDK identity session without making either a mandatory dependency.

Use one documented credential configuration across metadata, discovery, features, images, tiles,
and nested scene resources. Show exact-origin allowlists, including separately authorized asset
hosts. Document explicit URL/header precedence and why a stale URL token can prevent a callback
from taking effect. Keep credentials out of sample URLs and redact them from errors and telemetry.

Normalize both HTTP failures and ArcGIS JSON error envelopes. Authentication refresh must handle
498/499 where represented as ArcGIS errors, use bounded replay, and preserve response bodies for
normal parsing. Reuse the shared credential pipeline; keep ArcGIS error-envelope interpretation
provider-specific. Coordinate concurrent refreshes, propagate cancellation, distinguish expired
credentials from insufficient privileges, and prevent credentials from following untrusted URLs
or redirects. Cover these behaviors with deterministic request tests.

## Feature queries and large datasets

FeatureServer is the first tutorial and the main reliability priority. A successful request must
not silently suggest that a truncated response is the full dataset. Esri documents record limits
and pagination in its [query features guide](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/feature-services/query-features/).

Keep the generic `getFeatures()` output contract. Add an ArcGIS-specific page API that returns
features with completeness/continuation metadata, plus an async page iterator for deliberate
multi-page reads. Final method names and types belong in the implementation API review; the
behavioral contract is:

- Respect advertised record limits and query capabilities. Choose a supported continuation
  strategy; use offset paging with stable ordering when available, or object-ID batches where
  appropriate. Explicitly reject unsupported strategies rather than repeating the first page.
- Preserve stable identifiers, signal truncation, and set caller-controlled record/page bounds.
  Do not claim snapshot consistency while the service is being edited.
- Make incomplete `getFeatures()` results explicit, preferably through an actionable error that
  points to the page API, rather than silently discarding `exceededTransferLimit`.
- Support cancellation between and during requests. A viewport change should stop obsolete work.
- Document field selection, spatial and attribute filtering, output CRS, dates, nulls, IDs, and
  geometry conversion. Do not claim arbitrary reprojection or ArcGIS JSON geometry support.
- Initially constrain query response format to supported GeoJSON. Add Esri JSON parsing only as
  an explicitly scoped enhancement with tests, including services without GeoJSON support.

Server-side filtering should be the default performance advice. Teach when to use viewport
queries, explicit page iteration, vector tiles, or scene tiles instead of downloading all features.

## Developer guide structure

Create a prominent **Using ArcGIS with loaders.gl and deck.gl** entry at
`docs/developer-guide/arcgis/README.md`, linked from the main developer guide and ArcGIS module
landing page. Organize it around application tasks; keep detailed signatures in module reference.

| Guide page | Developer outcome | Required example or table |
| --- | --- | --- |
| Overview and quickstart | Display a public ArcGIS feature layer in deck.gl | Complete runnable app; installation, service URL, query, layer, attribution |
| Finding and choosing data | Navigate from ArcGIS item to a usable endpoint | Item vs service vs layer URL examples; service selection table |
| Supported services | Know what works before integrating | Central service matrix, deployment notes, profile details, explicit exclusions |
| Authentication | Access public and secured data | Authentication decision table and four complete recipes |
| Querying feature layers | Filter and read a bounded amount of data correctly | Metadata, fields, bounds, pagination, cancellation, CRS and output-shape examples |
| Visualizing with deck.gl | Choose a visualization for the task | GeoJSON, scatterplot, aggregation, imagery, vector tiles; tested source adapters |
| Imagery and numerical rasters | Distinguish rendered pixels from analytical values | MapServer/ImageServer comparison; LERC bands, masks and visualization recipe |
| 3D scenes and point clouds | Connect a supported SceneServer profile | Profile/output/renderer matrix; credentials on child requests |
| ArcGIS Online and Enterprise | Configure an actual deployment | Portal/service host distinction, CORS, federation, tested configurations |
| Performance and troubleshooting | Diagnose slow, incomplete or failed requests | Symptom/cause/fix table; limits, auth errors, CRS, style gaps, rate limiting |

The deck.gl chapter must show two independently validated paths: explicitly fetched data passed
to ordinary deck.gl layers, and automatic data fetching through `@loaders.gl/deck-layers` sources.
Explain how these differ from embedding deck.gl in an ArcGIS Maps SDK view. Include the latter as
an optional linked recipe only after checking its current compatibility.

Use GeoJSON for the first example because the data-to-layer relationship is visible. Follow with
binary and Arrow examples that name the actual compatible adapters; do not imply all deck.gl
layers accept every loaders.gl table shape. Carry through attribution from the service and link
to Esri's applicable usage guidance.

Create `docs/modules/arcgis/README.md` as the package reference landing page. Move and improve the
five existing service pages and API reference there; add authentication/discovery references.
Use one authoritative support table rather than diverging copies across the guide and README.
Every runnable example should have a clear data requirement, expected result, and known limit.

The tutorial should work from a fresh install. A public, small live dataset makes the hosted demo
useful; a local fixture version keeps documentation validation and required tests hermetic. Do not
embed credentials in the repository or require an Esri account for the first tutorial.

## Examples gallery and embedded service examples

Examples are a primary deliverable, with the same release priority as API documentation. Maintain
one runnable implementation per example and reuse it in the examples section and service page.
An embedded example must execute the API described on that page, not merely display similar data
through another implementation.

There is already an **ArcGIS Services** category in `website/src/examples-sidebar.js`, with four
linked examples. Existing service pages use `DocLiveExample` and `ClientExample`; extend that
foundation. ImageServer LERC and tile example files also exist, and scene examples currently live
under the I3S/3D categories. Audit their behavior before treating them as complete coverage.

Create an ArcGIS examples landing page with previews, short descriptions, and filters for service,
visualization, and access requirement. Organize examples by developer task: query and visualize
features, display maps and imagery, style numerical rasters, explore 3D data, and access private data.
Each card links to a full-size runnable example, its service guide, and the exact source code.
Add all relevant examples to navigation rather than leaving embedded or orphaned pages undiscoverable.

Every implemented service page must place a live example near the top, followed by its concise
code and operation support table. Below that, explain the data flow, authentication, options and
limits. Use synchronized **Example / Code / Request / Data** views where useful: readers should
see how a control changes the request and resulting data. Redact tokens from requests and errors.

| Service page or guide | Required embedded example | Meaningful interaction and visible evidence |
| --- | --- | --- |
| FeatureServer | Query a small public layer and render features | Bounds and attribute filter, field selection, picking, returned count and explicit completeness; add page iteration after it exists |
| MapServer | Cached tiles and dynamic export as separate modes | Layer selection where applicable, request endpoint and mode; do not imply image pixels are queryable features |
| ImageServer | Viewport imagery plus exported tiles | Bounds, opacity and a supported band/rendering-rule control; show `exportImage` requests and returned dimensions |
| ImageServer analytical raster | LERC values visualized with an explicit renderer | Band/color range, NoData mask and pixel inspection; show decoded values rather than a static image stand-in |
| VectorTileServer | Decoded vector tiles with application-controlled styling | Feature picking, source-layer filter and styling control; explain that this does not reproduce the service's full cartographic style |
| SceneServer | A profile selector for independently verified examples | 3D object, Point and PointCloud cases; picking and attributes; display profile/version and unsupported behavior |
| Building / integrated mesh guide | Existing I3S path, where validated | Identify the actual loader and rendering path; do not present it as generic SceneServer facade support |
| Discovery | Browse a small service directory and choose a source | Metadata/capabilities, unsupported entries and selected operation; does not require a map to be interactive |
| Authentication guide | Public demo plus a secured-service recipe | Session status, expiry/error handling and retry; optional user credentials kept in memory, with a clearly labeled fixture mode |

For any additional supported service page, adding its embedded example is part of the feature's
definition of done. Unsupported rows can remain in the inventory without a full service page.
If we create a gap/reference page, state the lack of an adapter prominently; any embedded
external-client recipe must name that client and distinguish it from loaders.gl support. Never
substitute a mock or recorded visualization for a claimed live integration without labeling it.

Example requirements:

- A sensible initial view and dataset, visible attribution, loading/empty/error states, and useful
  feedback when the live service is unavailable. No mandatory account for the default gallery.
- A full-size link and copyable complete source using actual package exports, including imports,
  options and application setup. Explanatory snippets can accompany it but cannot replace it.
- Shared state/configuration for gallery and embedded views so code, controls and descriptions do
  not drift. Add ArcGIS-specific navigation instead of relying on WMS-branded service tabs.
- Browser-only lazy mounting compatible with the website's server rendering. Stop requests and
  dispose of visualization resources on unmount; avoid many simultaneous WebGL canvases on an index.
- Responsive layout, keyboard-accessible controls, and readable errors. Use previews on gallery
  cards; activate the live renderer on the example or service page.
- Bounded queries, debouncing and cancellation for viewport changes. Credential input must never
  become part of a share URL, saved example, analytics event, or displayed request string.
- Deterministic fixture transport for required browser smoke tests, including one useful control
  interaction and its output assertion. Keep actual remote-service health checks in the external
  suite. Fixture and live modes must be visibly distinct, with no silent fallback implying live data.

Release acceptance: every implemented service row links to a relevant example; every supported
service page embeds its example; all gallery entries are discoverable; both embedded and full-size
views render and respond to controls in Chromium; imports, website build and internal links pass.
Manual visual checks cover a desktop and narrow viewport. A broken or misleading example blocks
the corresponding support claim until it is corrected or explicitly downgraded.

## Implementation sequence and acceptance

| Step | Deliverables | Completion criteria |
| --- | --- | --- |
| 1. Extract the module | Package manifest and exports; move six sources, discovery, ArcGIS credentials and aggregation; lazy root descriptors | No ArcGIS implementation imports remain in services; package imports and explicit subpaths work; feature import does not pull in scene/raster runtimes |
| 2. Make the data path reliable | Page API/iterator, complete-query behavior, typed error envelopes, consistent credentials and discovery | Deterministic tests demonstrate paging, bounded reads, cancellation, token refresh, origin scoping and useful failures |
| 3. Publish the guide, reference and examples | Task-oriented guide, full service inventory, authentication tables, examples gallery and service-page embeds | Fresh-install quickstart runs; each implemented service has a linked and embedded working example; support claims match evidence; browser smoke, visual review, website build and link checks pass |
| 4. Validate the ArcGIS story | Online/Enterprise external checks, versioned compatibility notes, example review | Tested configurations recorded; live checks remain outside required hermetic CI; demo and guide provide an accurate basis for Esri review |

Update all workspace dependencies, module catalogs, build configuration, test discovery/coverage
ownership, website examples and sidebars, READMEs, and internal imports in the extraction. Remove
stale legacy test entrypoint imports after moving tests. Retain other providers' credential helpers
and their tests in services. Add the new module to package discovery where it is not automatic.

Remove old ArcGIS exports from services and update import paths directly. Replace `SERVICE_LOADERS`
usage for ArcGIS with `ARCGIS_LOADERS`. Keep upgrade guidance limited to these removed/moved APIs;
put new feature documentation in the guide, module pages, and release notes. Update internal links
to the new pages instead of building compatibility documentation paths.

Use native Vitest in the owning module with minimal deterministic fixtures. Test paging boundaries,
malformed/service-error responses, credential expiry and concurrency, untrusted child URLs,
coordinate/output contracts, unsupported scene profiles, and metadata-to-runtime loading. Keep
only focused integration tests in core and deck-layers. Large scene/raster fixtures and exhaustive
matrices belong in slow tests; live ArcGIS checks belong in external tests. Do not lower coverage
thresholds to accommodate the move; transfer the existing coverage expectations to the new owner
and retain enforcement for services.

For implementation validation, run `yarn`, `yarn build`, `yarn build-workers`, `yarn test-node`,
`yarn test-headless`, `yarn test-audit`, and `yarn lint fix`. Run relevant slow coverage and merged
coverage checks under repository policy. Build the website with `yarn` and `yarn build` from
`website`; profile only newly expensive tests with `yarn test-profile <mode>`. Validate emitted
package exports and examples using built packages, not only source aliases.

The release deliverable is a focused ArcGIS data-access package, an accurate service/authentication
matrix, and a developer guide that takes an ArcGIS user through a working visualization. Esri
listing or endorsement is a separate outcome; documentation must not imply it has been granted.
