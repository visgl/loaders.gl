# @loaders.gl/deck-layers

Private internal deck.gl layers used by loaders.gl examples.

This package is not published and exists to share custom deck.gl layer
implementations across example applications in this repository.

Current shared layers include:

- `SourceLayer` for dispatching between tile sources and source-backed 3D tilesets
- `TileSourceLayer` for loaders.gl `TileSource` rendering through the `data` prop
- `Tile3DSourceLayer` for source-backed `Tileset3D` rendering
- `SourceDataDrivenTile3DLayer` for source-backed data-driven 3D tile rendering

Example usage:

```ts
import {SourceLayer, Tile3DSourceLayer} from '@loaders.gl/deck-layers';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource} from '@loaders.gl/tiles';

new Tile3DSourceLayer({
  id: 'explicit-source',
  data: new Tiles3DSource({url, loader: Tiles3DLoader})
});

new SourceLayer({
  id: 'auto-source',
  data: url,
  loaders: [Tiles3DLoader]
});
```
