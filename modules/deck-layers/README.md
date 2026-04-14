# @loaders.gl/deck-layers

Private internal deck.gl layers used by loaders.gl examples.

This package is not published and exists to share custom deck.gl layer
implementations across example applications in this repository.

Current shared layers include:

- `AnyLayer` for source-first dispatch across image, vector, 2D tile, and 3D tile source-backed URLs
- `Tile2DSourceLayer` for source-backed 2D tiles rendered through `Tileset2D`
- `SourceLayer` for dispatching between tile sources and source-backed 3D tilesets
- `TileSourceLayer` for loaders.gl `TileSource` rendering through the `data` prop
- `Tile3DSourceLayer` for source-backed `Tileset3D` rendering
- `SourceDataDrivenTile3DLayer` for source-backed data-driven 3D tile rendering

These layers are internal implementation details for examples and repository-local integrations.
They are intentionally documented only through TSDoc in source.
