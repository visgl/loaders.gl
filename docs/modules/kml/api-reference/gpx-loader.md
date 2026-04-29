import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';

# GPXLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

<KmlDocsTabs active="gpxloader" />

The `GPXLoader` parses [GPX files][gpx_wikipedia] into loaders.gl geometry tables.

[gpx_wikipedia]: https://en.wikipedia.org/wiki/GPS_Exchange_Format

## Usage

```typescript
import {GPXLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, GPXLoader, options);
```

## Shapes

`GPXLoader` returns loaders.gl `GeoJSONTable` objects by default. Set `gpx.shape` to select another table representation.

| Shape                | Output                                       |
| -------------------- | -------------------------------------------- |
| `geojson-table`      | loaders.gl GeoJSON table                     |
| `object-row-table`   | loaders.gl row table with GeoJSON features   |
| `arrow-table`        | loaders.gl `ArrowTable` with WKB geometry    |
| `binary-geometry`    | loaders.gl binary feature collection         |

## Options

| Option      | Type   | Default           | Description                            |
| ----------- | ------ | ----------------- | -------------------------------------- |
| `gpx.shape` | string | `'geojson-table'` | Selects the returned table shape.      |

## Limitations

- In Node.JS, applications must import `@loaders.gl/polyfills` for the `DOMParser` polyfill.
