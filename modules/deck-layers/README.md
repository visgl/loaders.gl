# @loaders.gl/deck-layers

Source-oriented deck.gl adapters maintained in loaders.gl while their APIs are prepared for
upstreaming to deck.gl-community. The package is private today, but the primary layers have typed
props, lifecycle tests, and no example-specific imports.

## SourceLayer

`SourceLayer` is the canonical entry point. Give it a URL or `Blob` and one ordered loader list:

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';
import {MVTLoader} from '@loaders.gl/mvt';

new SourceLayer({
  id: 'basemap',
  data: 'https://example.com/basemap.pmtiles',
  loaders: [PMTilesSourceLoader, MVTLoader]
});
```

Source loaders construct runtime sources. Parser loaders are automatically forwarded through
`sourceOptions.core.loaders`, so a source can parse its payloads without a second configuration
path. Source selection uses the supplied order plus loaders.gl URL, MIME, byte, and explicit-type
selection. There is no global loader registry or protocol probing.

The resolved runtime is dispatched to `ImageSourceLayer`, `VectorSourceLayer`,
`RasterSourceLayer`, `Tile2DSourceLayer`, `PointCloudSourceLayer`, or `Tile3DSourceLayer`.
`AnyLayer` remains as a deprecated compatibility alias.

### Discovery

When `layers` is omitted or set to `'auto'`, image and vector metadata is searched depth-first and
the first named leaf is selected. Compatible CRS values, 2D tile extent and zoom limits, and a
non-binding initial-view hint are inferred when available. Explicit props—including `layers: []`—
always take precedence.

```ts
new SourceLayer({
  data: 'https://example.com/geoserver/wms',
  loaders: [WMSSourceLoader],
  onSourceLoad: ({sourceType}) => console.log(sourceType),
  onMetadataLoad: metadata => console.log(metadata),
  onViewStateLoad: hint => setViewState(current => ({...current, ...hint})),
  onSourceError: error => console.error(error)
});
```

`SourceLayer` never changes deck.gl view state itself. Applications choose whether and how to apply
`onViewStateLoad` hints.

### Representative sources

```ts
// WFS vector features
new SourceLayer({data: wfsUrl, loaders: [WFSSourceLoader]});

// Typed GeoTIFF raster with automatic RGB/single-band colorization
new SourceLayer({data: geotiffUrl, loaders: [GeoTIFFSourceLoader]});

// COPC or Potree point-cloud hierarchy
new SourceLayer({
  data: pointCloudUrl,
  loaders: [COPCSourceLoader, PotreeSourceLoader]
});

// Parser-backed 3D Tiles, I3S, 3TZ, or SLPK
new SourceLayer({data: tilesetUrl, loaders: [Tiles3DLoader, I3SLoader, SLPKLoader]});
```

Service packages expose ordered registries for a single clean integration point:

```ts
import {SERVICE_LOADERS} from '@loaders.gl/services';

new SourceLayer({data: arcgisUrl, loaders: SERVICE_LOADERS});
```

Use `sourceOptions.core.type` when a URL is ambiguous. The deprecated `sources` prop is merged with
source loaders in `loaders` and deduplicated by identity. The singular `loader` prop and
preconstructed runtime sources remain supported.

## RasterSourceLayer

`RasterSourceLayer` requests the active viewport through `RasterSet` and renders typed samples with
`BitmapLayer`. It supports EPSG:4326 and EPSG:3857 bounds, RGB band selection, sampled 2nd/98th
percentile scaling, transparent no-data pixels (including metadata-level no-data values), and a
blue-to-yellow single-band ramp. CRS identifiers may be supplied as strings or authority-coded
PROJJSON definitions. Rasters without geospatial bounds use a full pixel-coordinate plane for
`OrthographicView`.

Use `rasterParameters` for source-specific dimensions, `getRasterParameters` for custom request or
projection logic, and `colorizeRaster` for application color maps.

## PointCloudSourceLayer

`PointCloudSourceLayer` renders normalized `PointCloudTilesetSource` runtimes such as COPC and
Potree. It owns `PointCloudTileset` traversal and forwards point styling, traversal options, tile
lifecycle callbacks, and optional bounding-box visualization.

The adapter currently subclasses `Tile3DLayer` to reuse deck.gl viewport bookkeeping and accesses
its protected traversal state. Moving that bookkeeping behind a deck.gl-community base adapter is
the main remaining upstream boundary; source resolution, rendering, and public props are otherwise
self-contained.

## Specialized layers

`ImageSourceLayer`, `VectorSourceLayer`, `RasterSourceLayer`, `Tile2DSourceLayer`, and
`PointCloudSourceLayer` also accept URL/Blob plus mixed `loaders` directly. Runtime sources passed by
`SourceLayer` are recognized and are never reconstructed. Prefer `SourceLayer` unless an
application intentionally wants to constrain the accepted runtime family.

Unsupported catalogs, SQL sources, generic table sources, and RAD chunks produce capability-based
diagnostics instead of being guessed into a renderer.

## Development

Behavioral coverage lives in `modules/deck-layers/test` and uses native Vitest for new integration
tests. The tile, WMS/WFS, GeoTIFF/GeoZarr/OME-TIFF, point-cloud, and I3S website examples exercise
the URL-plus-loaders API. Before upstreaming, run the repository build, worker build, Node and
headless test suites, test audit, and lint formatter described in the root `AGENTS.md`.
