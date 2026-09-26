# @loaders.gl/mvt

This module contains a geometry loader for Mapbox Vector Tiles (MVT) and a writer for generating MVT tiles from GeoJSON.

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent visualization-focused loaders (parsers).

## Metadata

Use `TileJSONLoader` to parse tileset metadata and `MapStyleLoader` to parse MapLibre / Mapbox
style JSON into a normalized style document with resolved source URLs and tile templates.

## Writing

Use the `MVTWriter` with `@loaders.gl/core`'s `encode` helper to serialize GeoJSON into a Mapbox Vector Tile `ArrayBuffer`.

```typescript
import {encode} from '@loaders.gl/core';
import {MVTWriter} from '@loaders.gl/mvt';

const arrayBuffer = await encode(geojson, MVTWriter, {
  mvt: {layerName: 'my-layer', version: 2, extent: 4096}
});
```

## Lightweight GeoJSON parsing

Applications that only need GeoJSON can import the dedicated MVT parser entry
instead of the full parser, which also supports Arrow and binary geometry:

```typescript
import {MVTGeoJSONLoaderWithParser} from '@loaders.gl/mvt/mvt-geojson-loader';

const tile = MVTGeoJSONLoaderWithParser.parseSync(arrayBuffer, {
  mvt: {coordinates: 'local', layerProperty: 'sourceLayer'}
});
```

The package root exports the metadata-only `MVTGeoJSONLoader`; core APIs can
preload its parser. The direct subpath is useful for custom workers and
integrations such as Tangram that already own their worker lifecycle. This
entry does not import Arrow or GIS converters.
