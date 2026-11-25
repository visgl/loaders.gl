# RasterBitmapLayer

`RasterBitmapLayer` from `@loaders.gl/deck-layers` draws one band of numeric samples with a
color lookup table on WebGL2 or WebGPU. It inherits deck.gl's `BitmapLayer` geometry, including
`bounds`, `coordinateSystem`, `_projectionTolerance`, and `opacity`.

```ts
import {RasterBitmapLayer} from '@loaders.gl/deck-layers';

const layer = new RasterBitmapLayer({
  id: 'elevation',
  raster: {data: new Float32Array([20, 100, 150, -9999]), width: 2, height: 2},
  bounds: [-123, 37, -122, 38],
  coordinateSystem: 'lnglat',
  valueRange: [0, 150],
  noData: -9999,
  colormap: 'viridis',
  interpolation: 'linear',
  pickable: true
});
```

## Props

| Prop            | Type                                                        | Default     | Description                                                                                                                                      |
| --------------- | ----------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `raster`        | `{data: TypedArray, width: number, height: number} \| null` | `null`      | Single-band samples in row-major order, top row first. Numeric arrays are uploaded as float32.                                                   |
| `valueRange`    | `[number, number]`                                          | `[0, 1]`    | Values that map to the endpoints of the color lookup table. Values outside the range are clamped. A zero-width range uses the first color.       |
| `noData`        | `number \| null`                                            | `null`      | Invalid sample sentinel. Non-finite samples are also invalid. Invalid texels are transparent, so `transparentColor` fills them.                                                                                    |
| `colormap`      | `'default' \| 'viridis' \| 'gray' \| Uint8Array`            | `'default'` | A preset or 1,024 RGBA bytes for a 256-entry color lookup table. The default preset samples the same ramp as `colorizeRasterData`.               |
| `valueScale`    | `'linear' \| 'sqrt' \| 'log'`                               | `'linear'`  | Transform after normalization and clamping. The square-root scale uses `sqrt(t)` and the log scale uses `log(1 + 9t) / log(10)`.                 |
| `interpolation` | `'linear' \| 'nearest'`                                     | `'linear'`  | Nearest texel or bilinear interpolation. Bilinear weights are renormalized over valid samples. Fragments with zero valid weight are transparent. |

## Picking

With `pickable: true`, picking info includes `bitmap` and `value`. The latter is the original CPU
sample at `bitmap.pixel`, or `null` for a missing, non-finite, or no-data sample. Linear
interpolation can draw color over an invalid texel using neighboring values, while picking that
texel still returns `null`. Picking uses BitmapLayer's 12-bit UV encoding.
