# Overview

The `@loaders.gl/terrain` module reconstructs mesh surfaces from either height
map images--e.g. [Mapzen Terrain Tiles][mapzen_terrain_tiles]--which encode
elevation into R,G,B values or the [quantized mesh][quantized_mesh] format.

[mapzen_terrain_tiles]: https://github.com/tilezen/joerd/blob/master/docs/formats.md
[quantized_mesh]: https://github.com/CesiumGS/quantized-mesh

## Installation

```bash
npm install @loaders.gl/terrain
npm install @loaders.gl/core
```

## Attribution

The `TerrainLoader` uses [MARTINI](https://github.com/mapbox/martini) for mesh
reconstruction.

The `QuantizedMeshLoader` uses
[`quantized-mesh-decoder`][quantized-mesh-decoder] from HERE under the MIT
license to decode quantized mesh.

[quantized-mesh-decoder]: https://github.com/heremaps/quantized-mesh-decoder

ISC License

Copyright (c) 2019, Mapbox

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
