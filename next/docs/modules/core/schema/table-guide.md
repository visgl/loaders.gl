# Working with Tables

***

## title: Working with tables description: Move between row-oriented and columnar table representations while keeping a stable application contract. hide\_title: true page\_style: designed[​](#title-working-with-tablesdescription-move-between-row-oriented-and-columnar-table-representations-while-keeping-a-stable-application-contracthide_title-truepage_style-designed "Direct link to title: Working with tables&#xA;description: Move between row-oriented and columnar table representations while keeping a stable application contract.&#xA;hide_title: true&#xA;page_style: designed")

<!-- -->

Table data

# Choose the table shape for the next operation.

loaders.gl tables can be convenient object rows or typed Arrow columns. The right representation depends on whether the next step is application logic, scanning, geometry processing, worker transfer, or writing.

[Table category](https://loaders.gl/next/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-table.md)[Apache Arrow](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

A small decision

## Keep data structured as it travels.

The table category gives related loaders a common result shape. Applications can start with readable rows, switch to Arrow for scale, and preserve the same pipeline boundaries as data moves between formats.

01

Object-row table

Easy to inspect and convenient for ordinary application code.

02

Arrow table

Typed columns suited to scans, transforms, workers, and analytics.

03

Table batch

A bounded unit for streaming and incremental processing.

04

Geometry table

Arrow-compatible columns for GeoArrow and spatial workflows.

Detailed guide

## Table category reference

The detailed material below explains the supported table interfaces, conversions, metadata, and the relationship between rows, batches, and Arrow columns.

The loaders.gl table category provides support for working interchangeably with row-oriented and columnar tables.
