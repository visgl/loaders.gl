# WKTWriter

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Writer for the [Well-known text] format for representation of geometry.

| Loader         | Characteristic                                                                              |
| -------------- | ------------------------------------------------------------------------------------------- |
| File Extension | `.wkt`,                                                                                     |
| File Type      | Text                                                                                        |
| File Format    | [Well Known Text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) |
| Data Format    | [Geometry](/docs/specifications/category-gis)                                               |
| Supported APIs | `encode`, `encodeSync`                                                                      |

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Usage

```typescript
import {WKTWriter} from '@loaders.gl/wkt';
```

## Options

N/A

## Attribution

The `WKTWriter` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
