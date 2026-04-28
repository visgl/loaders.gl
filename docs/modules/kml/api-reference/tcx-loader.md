import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';

# TCXLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

<KmlDocsTabs active="tcxloader" />

The `TCXLoader` parses [TCX files][tcx_wikipedia] into loaders.gl geometry tables.

[tcx_wikipedia]: https://en.wikipedia.org/wiki/Training_Center_XML

## Usage

```typescript
import {TCXLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, TCXLoader, options);
```

## Shapes

`TCXLoader` returns loaders.gl `GeoJSONTable` objects by default. Set `tcx.shape` to select another table representation.

| Shape                | Output                                       |
| -------------------- | -------------------------------------------- |
| `geojson-table`      | loaders.gl GeoJSON table                     |
| `object-row-table`   | loaders.gl row table with GeoJSON features   |
| `arrow-table`        | loaders.gl `ArrowTable` with WKB geometry    |
| `binary`             | loaders.gl binary feature collection         |

## Options

| Option      | Type   | Default           | Description                            |
| ----------- | ------ | ----------------- | -------------------------------------- |
| `tcx.shape` | string | `'geojson-table'` | Selects the returned table shape.      |

## Limitations

- In Node.JS, applications must import `@loaders.gl/polyfills` for the `DOMParser` polyfill.
