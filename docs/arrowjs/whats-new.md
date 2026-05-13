# What's New

This page collects relevant information about Apache Arrow JS releases.

:::caution
Apache Arrow JS follows cross-language versioning from the Apache Arrow project.
A major version bump does not always imply JavaScript API breakage.

For JS users, the primary risk is dependency alignment: multiple packages in the same app may resolve different `apache-arrow` majors and cause bundling/runtime incompatibilities.
:::

## v21.0

- [Apache Arrow 21.0.0](https://arrow.apache.org/release/21.0.0.html)
- Apache Arrow JS did not publish extensive JavaScript-only notes for this release stream; treat `tableFromIPC`/`tableToIPC`, message readers, and stream readers as the major integration touch points.

## v17.0

July 16, 2024

- [Apache Arrow 17.0.0](https://arrow.apache.org/release/17.0.0.html)
- Alignment guidance for loaders.gl users is in the [upgrade guide](./upgrade-guide).

## v16.1

May 14, 2024

- GH-40407 - [JS] Fix string coercion in MapRowProxyHandler.ownKeys (#40408)
- GH-39131 - [JS] Add at() for array-like types (#40730)
- GH-39482 - [JS] Refactor imports (#39483)
- GH-40959 - [JS] Store Timestamps in 64 bits (#40960)
- GH-40989 - [JS] Update dependencies (#40990)

## v16.0

April 20, 2024

- [Apache Arrow 16.0.0](https://arrow.apache.org/release/16.0.0.html)
- GH-40718 - [JS] Fix set visitor in vectors for js dates (#40725)
- GH-40851 - [JS] Fix nullcount and make vectors created from typed arrays not nullable (#40852)
- GH-40891 - [JS] Store Dates as TimestampMillisecond (#40892)
- GH-41015 - [JS][Benchmarking] allow JS benchmarks to run more portably (#41031)
- GH-40784 - [JS] Use bigIntToNumber (#40785)

## v15.0

Jan 21, 2024

- [Apache Arrow 15.0.0](https://arrow.apache.org/release/15.0.0.html)
- GH-39604 - Do not use resizable buffers yet (#39607)
- [Blog Post](https://arrow.apache.org/blog/2024/01/21/15.0.0-release/#javascript-notes)
- GH-39017 - Add typeId as attribute
- GH-39257 - LargeBinary
- GH-15060 - Add LargeUtf8 type
- GH-39259 - Remove getByteLength
- GH-39435 - Add Vector.nullable
- GH-39255 - Allow customization of schema when passing vectors to table constructor
- GH-37983 - Allow nullable fields in table when constructed from vector with nulls

Notes:

- GH-39017 (Add typeId as attribute) enabled schema reconstruction for cross-worker serialization.
