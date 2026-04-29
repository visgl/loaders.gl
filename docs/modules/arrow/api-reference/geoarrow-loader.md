import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';

# GeoArrowLoader

<ArrowDocsTabs active="geoarrowloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square" alt="From-v4.1" />
</p>

The `GeoArrowLoader` parses Apache Arrow columnar table format files, and looks for `GeoArrow` type extensions to parse geometries from the table.

## Usage

```typescript
import {GeoArrowLoader} from '@loaders.gl/arrow';
import {load} from '@loaders.gl/core';

const data = await load(url, GeoArrowLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
