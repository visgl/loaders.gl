# Map Styles

- _[`@loaders.gl/mvt`](/docs/modules/mvt)_
- _[Mapbox Style Specification](https://docs.mapbox.com/style-spec/guides/)_
- _[MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/)_

## Overview

A map style document is a JSON file that describes how a tiled basemap should be assembled and
styled. It does not contain the tile data itself. Instead, it points at tile sources and defines
an ordered layer list that tells a renderer which source to read from and how to draw each layer.

`MapStyleLoader` in loaders.gl focuses on the metadata and resource resolution part of the format:

- parsing style JSON
- resolving relative source URLs
- dereferencing TileJSON-backed sources
- normalizing tile template URLs so downstream code can fetch tiles directly

It does not implement the full style rendering model. Expressions, paint rules, symbol placement,
fonts, sprites, and renderer-specific behavior are preserved as metadata for an application to use.

## Main Sections

### Top-level metadata

Common top-level fields include:

- `version`: style-spec version, typically `8`
- `name`: human-readable style name
- `metadata`: implementation-specific metadata bag
- `center`, `zoom`, `bearing`, `pitch`: default camera hints
- `sprite`: sprite sheet base URL
- `glyphs`: font glyph URL template

These fields describe the style document itself and often contain additional sub resources that a
renderer may need later.

### `sources`

`sources` is a dictionary keyed by source id. Each source describes where tile data or imagery
comes from.

Common source fields include:

- `type`: source kind such as `vector`, `raster`, `raster-dem`, `geojson`, or `image`
- `tiles`: direct tile URL templates
- `url`: an indirection URL, commonly a TileJSON document
- `minzoom`, `maxzoom`
- `tileSize`
- format-specific fields such as `bounds`, `scheme`, `attribution`, or custom metadata

For loaders.gl, `sources` is the critical section because it determines which sub resources must be
resolved before the style is immediately usable.

### `layers`

`layers` is an ordered array. Each entry references a source and describes how a logical layer
should be rendered.

Common layer fields include:

- `id`
- `type`
- `source`
- `source-layer`
- `minzoom`, `maxzoom`
- `filter`
- `layout`
- `paint`

Layer order matters. Even when loaders.gl is not rendering the style directly, preserving layer
order and metadata is important because applications often inspect this list to decide which tile
layers to load or how to configure a renderer.

## Sub Resources

A style document often depends on additional resources:

- TileJSON documents referenced from `sources.*.url`
- tile templates referenced from `sources.*.tiles`
- sprite manifests and sprite images from `sprite`
- font glyph PBF ranges from `glyphs`
- images, models, or other renderer-specific assets referenced through metadata or extensions

`MapStyleLoader` currently resolves only the tile-source side of this graph:

- the top-level style JSON itself
- any source `url` values
- any `tiles` arrays found in the source or fetched TileJSON

Other resources such as sprites and glyphs remain untouched in the returned object.

## Resolution Complications

### Relative URL resolution

Style files frequently use relative paths:

```json
{
  "sources": {
    "basemap": {
      "type": "vector",
      "url": "./tileset.tilejson"
    }
  },
  "glyphs": "./fonts/{fontstack}/{range}.pbf"
}
```

Those paths are ambiguous without a base URL. loaders.gl resolves source URLs against:

1. `mapStyle.baseUrl` when provided
2. the loader context URL when the style was loaded from a URL or file
3. the fetched style URL itself when `resolveMapStyle(styleUrl)` is used

### TileJSON indirection

Many styles do not list tile templates directly. Instead, a source points at TileJSON:

```json
{
  "sources": {
    "basemap": {
      "type": "vector",
      "url": "https://example.com/basemap.tilejson"
    }
  }
}
```

That TileJSON may itself contain relative `tiles` entries. In that case there are two resolution
steps:

1. resolve the TileJSON URL relative to the style
2. resolve the TileJSON `tiles` entries relative to the fetched TileJSON URL

This second hop is why applications often end up with broken tile requests if they only resolve the
style URL and forget that the sub resource can introduce a new base path.

### Partial specification support

The style specification is broad. Some fields are renderer-level semantics rather than loader-level
metadata. loaders.gl preserves unknown fields, but it only validates and normalizes the portions
needed to make tile sources consumable.

### Mixed source shapes

Not every source looks the same:

- direct `tiles` arrays
- `url` indirection through TileJSON
- non-tile sources such as inline GeoJSON
- renderer extensions with extra metadata

`MapStyleLoader` keeps the returned source objects permissive so these variants survive intact after
parsing.

## Returned Shape in loaders.gl

loaders.gl returns a normalized object with:

- all original style fields preserved
- `sources` always present as an object
- `layers` always present as an array
- fetched TileJSON fields merged into the corresponding source
- resolved absolute URLs in `source.url` and `source.tiles[]`

See [`MapStyleLoader`](/docs/modules/mvt/api-reference/map-style-loader) for the exact returned
data format.
