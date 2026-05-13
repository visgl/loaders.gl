import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';

# KMLLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

<KmlDocsTabs active="kmlloader" />

![ogc-logo](../../../images/logos/ogc-logo-60.png)

The `KMLLoader` parses [KML files][kml_wikipedia] into loaders.gl geometry tables.

[kml_wikipedia]: https://en.wikipedia.org/wiki/Keyhole_Markup_Language

## Usage

```typescript
import {KMLLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, KMLLoader, options);
```

## Shapes

`KMLLoader` returns loaders.gl `GeoJSONTable` objects by default. Set `kml.shape` to select another table representation.

| Shape                | Output                                       |
| -------------------- | -------------------------------------------- |
| `geojson-table`      | loaders.gl GeoJSON table                     |
| `object-row-table`   | loaders.gl row table with GeoJSON features   |
| `arrow-table`        | loaders.gl `ArrowTable` with WKB geometry    |

## Options

| Option      | Type   | Default           | Description                            |
| ----------- | ------ | ----------------- | -------------------------------------- |
| `kml.shape` | string | `'geojson-table'` | Selects the returned table shape.      |

## Limitations

- In Node.JS, applications must import `@loaders.gl/polyfills` for the `DOMParser` polyfill.
