# Mapbox Vector Tile

- *[`@loaders.gl/mvt`](/docs/modules/mvt)*
- *[Mapbox Vector Tile Specification](https://github.com/mapbox/vector-tile-spec)*

A specification for encoding tiled vector data.

MVT is a protobuf-encoded format that defines geospatial geometries.

tiles contain layers with features, the features can have geometries and properties.

## Metadata

It is often useful to have global metadata about a tileset. A common complementary format for encoding tileset metadata is [TileJSON](./tilejson).

## Encoding

If you want to know more about how geometries are encoded into MVT tiles, see this section in the [specification](https://docs.mapbox.com/vector-tiles/specification/#encoding-geometry).

