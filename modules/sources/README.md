# @loaders.gl/sources

Lightweight adapters for remote data services.

## Open-Meteo point weather

```ts
import {LocationWeatherSource} from '@loaders.gl/sources';

const source = new LocationWeatherSource();
const current = await source.getWeather({longitude: -80.4, latitude: 25.1});
const historical = await source.getWeather({
  longitude: -80.4, latitude: 25.1,
  time: new Date('2024-01-15T12:00:00Z')
});
```

The adapter requests Open-Meteo current or hourly historical data and normalizes
cloud cover and wind speed. Historical timestamps are sampled at the containing
UTC hour; there is no interpolation. Null values mean unavailable measurements.
Precipitation and snowfall represent amounts over the provider reporting interval.

**Scope:** This is a point-query source, not a weather grid. Globe and regional
weather effects require gridded datasets (e.g. GFS/ERA5) and an additional
spatial source implementation. Do not extrapolate one point across a map.

Open-Meteo's public free API is intended for non-commercial use and subject to
its published terms and rate limits. Review licensing before commercial deployment.

## Coarse regional weather grids

```ts
import {WeatherGridSource} from '@loaders.gl/sources';

const source = new WeatherGridSource();
const grid = await source.getWeather({
  bounds: [-90, 20, -70, 35],
  width: 8,
  height: 6,
  time: new Date('2024-01-15T12:00:00Z'),
  variables: ['cloudCover', 'rain', 'snowfall', 'visibility']
});
const clouds = grid.fields.cloudCover; // Float32Array, north-to-south rows
```

This first implementation batches **Open-Meteo point queries** into a
regular sampled grid, with a conservative default limit of 100 cells.
It is not a native model raster and cannot efficiently render a high-resolution
global weather field. Values represent sampled model points, not area averages.
A native GFS/ERA5/OM grid backend remains a follow-up. Bounds crossing the
antimeridian are not yet supported. Missing values are NaN.
