Arrow JS · migration

# Upgrade the table library without losing the data path.

Arrow JS uses a cross-language versioning scheme, so releases do not always map neatly to user-facing JavaScript changes. This guide highlights the migration points most relevant to loaders.gl and browser applications.

[Arrow JavaScript](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Arrow JS introduction](https://loaders.gl/next/docs/arrowjs/developer-guide/introduction.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/developer-guide/introduction.md)[Contributing notes](https://loaders.gl/next/docs/arrowjs/contributing.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/contributing.md)

How to use this guide

## Check the version, then check the boundaries.

Start with the Arrow major line used by your application, verify the factory and table APIs it relies on, and make sure browser, worker, and Node.js bundles resolve one compatible Arrow installation.

01

Current

Start with the v21 notes and your resolved package version

02

Factories

Prefer current table, vector, reader, and writer constructors

03

Removed APIs

Replace legacy DataFrame and class-specific factories

04

Runtime

Check streams, polyfills, and duplicate package installations

Detailed guide

## Version-by-version migration notes

The sections below summarize the documented JavaScript-facing changes and the practical checks that loaders.gl applications should make during an upgrade.

Apache Arrow JS does not publish detailed JavaScript-only upgrade notes beyond the common [Apache Arrow release notes](https://arrow.apache.org/release/).

It follows a cross-language versioning scheme, so major version bumps can be frequent and may not correspond to user-facing JavaScript changes.

The biggest Arrow JS changes affecting APIs were introduced in v9.0 (based on feedback from loaders.gl users).

## Upgrading to v21.0[​](#upgrading-to-v210 "Direct link to Upgrading to v21.0")

* No broadly breaking Arrow JS-only API changes were documented for this stream in the release notes.

* If you are upgrading from v15-v17, focus on:

  <!-- -->

  * Ensure `apache-arrow` is resolved to one version in your app (avoid dual installs).
  * Prefer `makeTable`, `tableFromArrays`, `tableFromIPC`, `makeBuilder`, and stream readers/writers over older class-specific factories.
  * Replace legacy column references (`getColumn`) with `getChild`/`getChildAt` and avoid removed `DataFrame`/`FilteredDataFrame` APIs.

For loaders.gl users, prefer a single `apache-arrow` major line across browser and node environments to avoid stream and schema incompatibilities.

## Upgrading to v17.0[​](#upgrading-to-v170 "Direct link to Upgrading to v17.0")

* No major breaking Arrow JS-only API changes were documented for this stream.

For loaders.gl users moving from older versions, verify the following common changes:

* `RecordBatchWriter` factory usage and stream writer entry points (`RecordBatchStreamWriter`, `RecordBatchFileWriter`) are the normal writer constructors.
* APIs that depended on deprecated concepts (`DataFrame`, `Column`, `FilteredDataFrame`, predicate helpers) should be migrated to Arrow-native table/vector workflows.
* Confirm environment-specific bundling for browser/Node stream support, especially if you ship custom stream polyfills.

## Upgrading to v16.0[​](#upgrading-to-v160 "Direct link to Upgrading to v16.0")

* No significant changes in Apache Arrow JS.

## Upgrading to v15.0[​](#upgrading-to-v150 "Direct link to Upgrading to v15.0")

* No significant changes in Apache Arrow JS.

## Upgrading to v14.0[​](#upgrading-to-v140 "Direct link to Upgrading to v14.0")

* No significant changes in Apache Arrow JS.

## Upgrading to v13.0[​](#upgrading-to-v130 "Direct link to Upgrading to v13.0")

* Apache Arrow JS removed the BigInt compatibility workaround.

## Upgrading to v12.0[​](#upgrading-to-v120 "Direct link to Upgrading to v12.0")

* Bug found: can break table reads in rare cases when dictionaries have bigint keys.

## Upgrading to v11.0[​](#upgrading-to-v110 "Direct link to Upgrading to v11.0")

* No significant changes in Apache Arrow JS.

## Upgrading to v10.0[​](#upgrading-to-v100 "Direct link to Upgrading to v10.0")

* No significant changes in Apache Arrow JS.

## Upgrading to v7.0 / v8.0 / v9.0[​](#upgrading-to-v70--v80--v90 "Direct link to Upgrading to v7.0 / v8.0 / v9.0")

> In case it is helpful, changes made to loaders.gl can be found in this [PR](https://github.com/visgl/loaders.gl/pull/2276/files)

These releases made a series of breaking changes to Apache Arrow JS to transform it into a lean, tree-shakeable "core" library.

The downside is that upgrading through Arrow JS v7.0-v9.0 tends to require care since documentation is sparse.

The following are high-level observations from migrating applications:

**Removed core classes**

| Removed Feature | Alternative    | Comment                                                                      |
| --------------- | -------------- | ---------------------------------------------------------------------------- |
| `Column` class  | `Vector` class | `Vector` supports chunking, removing the need for a separate `Column` class. |

**Removed static constructors**

| Removed Feature                 | Alternative             | Comment                                                 |
| ------------------------------- | ----------------------- | ------------------------------------------------------- |
| `Data` static factory methods   | `makeData()` function   | Static constructors were replaced with factory helpers. |
| `Column` static factory methods | `makeVector()` function | —                                                       |
| `Table` static factory methods  | `makeTable()` function  | —                                                       |
| `Schema` static factory methods | `makeSchema()` function | —                                                       |

**DataFrame removal** — the API removed a number of higher-level conveniences built outside Arrow core. These are now expected to be composed by user code.

| Removed Feature     | Alternative | Comment                            |
| ------------------- | ----------- | ---------------------------------- |
| `DataFrame`         | N/A         | See above                          |
| `FilteredDataFrame` | N/A         | See above                          |
| Predicates          | N/A         | Implement app-level filter helpers |
| `Table.filter`      | N/A         | Implement app-level filter helpers |

For filtering and data-frame style operations, libraries like [Arquero](https://github.com/uwdata/arquero) are common alternatives.

If you need loader-specific migration notes, also check: [PR 1931](https://github.com/visgl/loaders.gl/pull/1931/files)

## Upgrading to v6.0 and earlier[​](#upgrading-to-v60-and-earlier "Direct link to Upgrading to v6.0 and earlier")

Unfortunately we don't have notes for these releases.
