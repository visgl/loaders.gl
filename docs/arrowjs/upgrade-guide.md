# Upgrade Guide

Unfortunately for JavaScript users, Apache Arrow JS does not publish detailed ugrade guides notes beyond the common [Apache Arrow release notes](https://arrow.apache.org/release/).

Also Apache Arrow JS follows a common cross-language versioning number scheme which leads to frequent major release bumps, that confusingly do not contain any significant JavaScript changes (sometimes a major version bump has no JavaScript changes at all). 

The biggest changes were made in Apache Arrow JS Version 9.0 (based on feedback from loaders.gl users).

## Upgrading to v15.0

- No significant changes in Apache Arrow JS

## Upgrading to v14.0

- No significant changes in Apache Arrow JS

## Upgrading to v13.0

- Under the hood, Apache Arrow JS removed "big int" fallback handling (big ints are now supported by all current browsers and Node.js versions).

## Upgrading to v12.0

- Bug found: Can break table reads in rare cases, e.g when dicts have big int keys.

## Upgrading to v11.0

- No significant changes in Apache Arrow JS

## Upgrading to v10.0

- No significant changes in Apache Arrow JS

## Upgrading to v7.0 / v8.0 / v9.0

> In case it is helpful, changes made to loaders.gl can be found in this [PR](https://github.com/visgl/loaders.gl/pull/2276/files)

These releases made a series of breaking changes to Apache Arrow JS to transform it into a lean, tree-shakeable "core" library.

The good news is that Apache Arrow v9.0 resolves a big concern around the size of the ArrowJS library. The size issue was creating resistance against full-scale Arrow JS adoption in some code bases. For instance, in loaders.gl, even trivial usage of the loaders.gl `ArrowLoader` would lead to ~250KB of Apache Arrow dependencies being bundled before v9.0.

The downside is that upgrading through Arrow JS v7.0-v9.0 tends to require a big effort for most older applications. This is made more difficult since Apache Arrow does not have good release notes. The following are observations from upgrading applications:

**Removed core classes**

| Removed Feature | Alternative    | Comment                                                                           |
| --------------- | -------------- | --------------------------------------------------------------------------------- |
| `Column` class  | `Vector` class | The `Vector` class now supports chunking, removing the need for a `Column` class. |


**Removed static constructors**

| Removed Feature                 | Alternative             | Comment                                                                           |
| ------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| `Data` static factory methods   | `makeData()` function   | Referencing the Data class doesn't automatically pull in static constructor code. |
| `Column` static factory methods | `makeVector()` function |
| `Table` static factory methods  | `makeTable()` function  |
| `Schema` static factory methods | `makeSchema()` function |


**DataFrame removal** - A number of pre-9.0 features didn’t really fit into Arrow core functionality. These features were really a library on top of Arrow, and in the trade-off of keeping the Arrow JS core lean, they were removed.

| Removed Feature     | Alternative | Comment   |
| ------------------- | ----------- | --------- |
| `DataFrame`         | N/A         | See below |
| `FilteredDataFrame` | N/A         | See below |
| Predicates          | N/A         | See below |
| `Table.filter`      | N/A         | See below |

While there are no alternatives for the removed features inside Apache Arrow JS v9.0+, applications can implement similar logic on top of Arrow JS. There are also high-quality independent libraries such as [Arquero](https://github.com/uwdata/arquero) that provide support for filtering and processing of Arrow JS tables.

Finally, in case it is helpful, changes made to loaders.gl can be found in this [PR](https://github.com/visgl/loaders.gl/pull/1931/files)

## Upgrading to v6.0 and earlier

Unfortunately we don't have any notes for these releases.
