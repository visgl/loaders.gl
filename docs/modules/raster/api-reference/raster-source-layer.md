# RasterSourceLayer

`RasterSourceLayer` from `@loaders.gl/deck-layers` requests the active viewport from a
loaders.gl `RasterSource`. Give the layer a source instance, or give it a URL or Blob and a
matching source loader in `loaders`.

```ts
import {RasterSourceLayer} from '@loaders.gl/deck-layers';
import {GeoTIFFLoader} from '@loaders.gl/raster';

const layer = new RasterSourceLayer({
  id: 'elevation',
  data: '/elevation.tif',
  loaders: [GeoTIFFLoader],
  rendering: 'gpu',
  pickable: true
});
```

## Rendering and styling

| Prop               | Type                                             | Default                             | Description                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rendering`        | `'cpu' \| 'gpu'`                                 | `'cpu'`                             | CPU rendering converts the raster to RGBA for deck.gl's BitmapLayer. GPU rendering uses [RasterBitmapLayer](./raster-bitmap-layer.md) for single-band responses. Multi-band responses use CPU rendering. |
| `valueRange`       | `[number, number]`                               | Per-raster 2nd and 98th percentiles | GPU color scale endpoints. Pass an explicit range to keep the same endpoints across viewport requests.                                                                                                   |
| `colormap`         | `'default' \| 'viridis' \| 'gray' \| Uint8Array` | `'default'`                         | GPU color lookup table. The default preset uses the CPU color ramp. A custom table contains 256 RGBA entries.                                                                                            |
| `valueScale`       | `'linear' \| 'sqrt' \| 'log'`                    | `'sqrt'`                            | GPU transform applied to the normalized sample value.                                                                                                                                                    |
| `renderSubLayer`   | `(props: RasterSourceSubLayerProps) => Layer`    | —                                   | Creates a custom layer with the props of the default sublayer. GPU props include `raster`; CPU props include `image`.                                                                                    |
| `colorizeRaster`   | `(raster, context) => RasterRenderResult`        | —                                   | Overrides CPU colorization and optionally supplies bounds and a coordinate system.                                                                                                                       |
| `bitmapLayerProps` | `Partial<BitmapLayerProps>`                      | `{}`                                | Additional props for either sublayer, including placement and projection settings.                                                                                                                       |

Both paths use the same default stretch, square-root scale, and color ramp for single-band rasters.
The stretch uses up to 4,096 evenly spaced samples from the current response. The GPU interpolates
sample values before applying color, which can change the appearance of smoothed edges.

Style changes reuse the current raster. The GPU path uses raster masks and takes no-data from the response, including
per-band metadata, with source-level metadata as a fallback. Use `pickable: true` to read the
original single-band texel as `info.value` on GPU picks and on CPU bitmap picks with matching
dimensions.

## Requests and placement

Use `rasterParameters` to override inferred request fields and `getRasterParameters` for custom
viewport logic. MapView and GlobeView support EPSG:4326, EPSG:3857, and projected CRSs that
math.gl can resolve, such as UTM EPSG:32626. For a projected source, the layer requests the
visible portion of the source extent and places the CPU or GPU bitmap in source coordinates.
Ungeoreferenced rasters use a pixel-coordinate plane.

The layer requests one raster per viewport, so distant visible ground near the horizon can make the request coarser.

A large bitmap in a projected CRS draws as one quad by default. Set deck.gl's
`bitmapLayerProps._projectionTolerance` for adaptive refinement, or set the view's `resolution`
to subdivide the bitmap on a grid.

For a CRS that requires custom placement, supply `getRasterParameters` and provide `bounds`
and `coordinateSystem` in `bitmapLayerProps` for the GPU path or return them from
`colorizeRaster` for the CPU path.
