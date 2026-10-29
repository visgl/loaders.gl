Lance API / Arrow readers

# Read the columns that answer the question.

The Lance Arrow helpers perform focused reads from Lance data files. They keep the current supported boundary explicit: selected fixed-width primitive columns and two-dimensional float coordinates, decoded directly into Arrow.

[Lance module](https://loaders.gl/next/docs/modules/tables/lance.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/lance.md)[Lance source](https://loaders.gl/next/docs/modules/tables/lance/api-reference/lance-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/lance/api-reference/lance-source-loader.md)[Apache Arrow](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

Bounded column reads

## Keep the read narrow and the result typed.

These helpers are useful when a dataset is larger than the immediate operation. The caller selects physical columns and names, the reader issues only the required range requests, and the result remains an Arrow table.

01

Select

Provide physical column indexes and explicit names.

02

Transport

Read local files or remote byte ranges.

03

Decode

Handle supported fixed-width primitive Lance encodings.

04

Return

Produce Arrow columns, including 2D coordinate columns.

Detailed guide

## Lance Arrow reader reference

The detailed reference covers helper signatures, supported physical types, coordinate reads, remote ranges, and current limitations.

![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

The Lance Arrow helpers perform bounded reads from a local or remote Lance data file. `readLanceRemoteFileToArrow()` supports selected fixed-width primitive columns. `readLanceRemoteCoordinatesToArrow()` supports two-dimensional fixed-size float columns such as PushT's `observation_state`.

Both APIs are Work In Progress and currently require physical column indexes, explicit names, and known Lance encodings.
