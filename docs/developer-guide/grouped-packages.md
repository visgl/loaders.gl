# Packages and format entrypoints

loaders.gl groups related formats into independently installable packages. Start with the
[Packages overview](../packages.md) to find the owner of a format, then use its format reference
for options and output types. For example, CSV belongs to `@loaders.gl/tables`, LAS belongs to
`@loaders.gl/pointclouds`, and glTF belongs to `@loaders.gl/scene`.

## Install packages, import formats

Install the package and its core peer dependency. A format subpath is an import path, not a
separately published npm package:

```sh
npm install @loaders.gl/core @loaders.gl/tables @loaders.gl/geospatial
```

```ts
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables/csv';
import {KMLLoader} from '@loaders.gl/geospatial/kml';

const table = await parse(csvData, CSVLoader);
const features = await parse(kmlData, KMLLoader);
```

Package roots provide the common public APIs. Format subpaths provide focused access to the
formats, writers, sources, types, and helpers documented for that format. Use bare format
subpaths such as `/csv`, rather than appending `/index`.

## Metadata loaders and parser implementations

A metadata loader describes the format, options, default values, and output types. It has no
parsing methods; its `preload()` function imports the parser implementation. Core asynchronous
APIs such as `load`, `parse`, and `parseInBatches` can preload it automatically.

The tables, geospatial, pointclouds, and scene roots and bare format entrypoints expose metadata
loaders. Other packages have entrypoint-specific contracts: raster's root exposes metadata,
while `/geotiff` and `/lerc` expose parser-bearing loaders. Follow each package reference rather
than assuming every entrypoint exports the same loader names.

For synchronous parsing, import the parser-bearing loader explicitly:

```ts
import {parseSync} from '@loaders.gl/core';
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv-loader';

const table = parseSync(csvData, CSVLoaderWithParser);
```

See [Metadata loaders and parser loading](./using-metadata-loaders.md) for preloading, caching,
and the distinction between application parser chunks and worker bundles. Metadata loading is
the default for these grouped entrypoints; an `/unbundled` suffix is unnecessary.

## Sources and writers

A loader parses an input into a result. A source opens a dataset or service and supports requests
such as scans, raster windows, or tile reads. Source constructors and advanced APIs have explicit
subpaths, for example `@loaders.gl/raster/geotiff-source-loader` and
`@loaders.gl/tables/parquet-source-loader`.

Writers are documented by their format. Some writers import encoding dependencies eagerly, so
an entrypoint that exports both metadata and a writer is not necessarily dependency-free.

## Dependencies and installation size

Subpaths let bundlers select code and defer parsers. They do not change which ordinary npm
dependencies are installed for a package. Measure installation size, initial application code,
and deferred parser chunks separately.

| Format or capability | Additional package | Installation contract |
| --- | --- | --- |
| BSON | `bson` | Optional dependency of tables; needed by BSON parsing and synchronous writing. |
| Parquet WASM backend | `parquet-wasm` | Optional backend; the JavaScript backend has separate capabilities. |
| GeoPackage | `sql.js` | Optional peer dependency; applications install it explicitly. |
| GeoTIFF image/source APIs | `geotiff` | Optional peer dependency; the native numeric decoder supports a subset without it. |
| LERC | `lerc` | Optional peer dependency. |
| Database engines | Engine-specific packages | See the [SQL package](../modules/sql/README.md). |

Keep core and format packages on compatible versions. See the owning format reference for
supported backend versions, WASM configuration, and runtime-specific requirements.

## Core utilities and package boundaries

Core owns format-neutral utilities through independent subpaths:

- `core/loader-utils` and `core/worker-utils`: loader contracts, sources, streams, and worker infrastructure.
- `core/schema` and `core/schema-utils`: data contracts, table helpers, and Arrow transport.
- `core/arrow-geometry`: focused geometry construction used by loaders.
- `core/geoarrow`: application-level GeoArrow conversion and processing.
- `core/scan`: portable scans, query planning, and federation; SQL backends register from the SQL package.
- `core/wkt`: geometry codecs; WKT, WKB, and TWKB loader/writer descriptors belong to geospatial.
- `core/polyfills`: independent Node platform adapters.

Core implementations do not depend on other loaders.gl packages. Published format packages
use core as a peer dependency. Scan, arrow-geometry, geoarrow, and WKT utilities require their
explicit subpath imports; they are not exported by the core root.

## Workers and assets

Workers and WASM assets belong to the package that owns the implementation. For example, CSV
workers are shipped by tables, and LAS workers by pointclouds. Use assets matching the installed
package version. When self-hosting, configure the documented worker URL and copy the assets
from the owning package. See [Using workers](./using-worker-loaders.md).

## Upgrading older imports

The standalone format and utility packages removed during consolidation are not forwarding
packages. Update installation commands, imports, and asset URLs together using the
[upgrade guide](../upgrade-guide.md). The current package references describe the supported
layout; proposed future consolidations are not part of that layout.
