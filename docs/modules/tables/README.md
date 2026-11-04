import {FormatLogo} from '@site/src/components/docs/format-logo';
import {ModuleSubpaths} from '@site/src/components/docs/module-subpaths';

# @loaders.gl/tables

Table and record formats share one package, with format-specific metadata and parser entrypoints.

| Format | Subpath | Description |
| --- | --- | --- |
| <FormatLogo slug="arrow" /> | [`/arrow`](./arrow/README.md) | [Apache Arrow](./arrow/formats/arrow.md) and [GeoArrow](./arrow/formats/geoarrow.md) |
| <FormatLogo slug="avro" /> | [`/avro`](./avro/README.md) | Apache Avro |
| <FormatLogo slug="csv" /> | [`/csv`](./csv/README.md) | [CSV, TSV, and DSV](./csv/formats/csv.md) |
| <FormatLogo slug="delta" /> | [`/delta`](./delta/format.md) | Delta Lake tables |
| <FormatLogo slug="hudi" /> | [`/hudi`](./hudi/format.md) | Apache Hudi tables |
| <FormatLogo slug="iceberg" /> | [`/iceberg`](./iceberg/format.md) | Apache Iceberg tables |
| <FormatLogo slug="json" /> | [`/json`](./json/README.md) | [JSON](./json/formats/json.md), [GeoJSON](./json/formats/geojson.md), [geometry](./json/formats/geojson-geometry.md), and newline-delimited variants |
| <FormatLogo slug="lance" /> | [`/lance`](./lance/README.md) | Lance datasets |
| <FormatLogo slug="orc" /> | [`/orc`](./orc/README.md) | [Apache ORC](./orc/formats/orc.md) |
| <FormatLogo slug="parquet" /> | [`/parquet`](./parquet/README.md) | [Parquet](./parquet/formats/parquet.md) and [GeoParquet](./parquet/formats/geoparquet.md) |

Import metadata from `@loaders.gl/tables` or a bare format subpath such as `@loaders.gl/tables/csv`. Import parser-bearing loaders from named implementation subpaths such as `@loaders.gl/tables/csv-loader`. See [Packages](../../packages.md) for installation and loading patterns.

BSON document loaders and codecs live in [`@loaders.gl/documents`](/docs/modules/documents).
Parquet BSON logical columns use that codec automatically.


## Package exports

<ModuleSubpaths module="tables" />
