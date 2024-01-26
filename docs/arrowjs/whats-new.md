# What's New

This page attempts to collect some of the relevant information about apache-arrow JS releases.
Unfortunately for JavaScript users, Apache Arrow JS release notes are not very easy to find:
- There are the [Apache Arrow release notes](https://arrow.apache.org/release/) where we can scan for issues with the `[JS]` tag.
- But there are also [blog posts](https://arrow.apache.org/blog/) that can contain different/additional information in the `JavaScript notes` section.
- And every minor release has its own page and blog, so users need to scan through a lot of docs to catch all changes.
- Additionally, the release notes are very brief, more of a PR title rather than a user facing description of what the change entails without reading the linked github issue.

:::caution
Apache Arrow JS follows the versioning number scheme for the cross-language Apache Arrow repository releases,
which results in frequent major release bumps, even though no significant or breaking JavaScript changes have been introduced. 

This can be an inconvenience for JavaScript applications that rely on [semantic versioning](https://semver.org) 
to restrict dependencies to compatible package. Therefore some extra attention around versions may be required, 
especially if your app uses multiple JavaScript packages dependent on arrow. You may end up bundling two 
different arrow js versions or the build may break due to version requirement incompatibilities.
:::

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
- GH-39017 (Add typeId as attribute) is significant for loaders.gl as it enables arrow Schemas to be
reconstructed after being serialized (e.g. when posted between worker threads). 

## v14.0

Nov, 2023

- [Apache Arrow 14.0.0](https://arrow.apache.org/release/14.0.0.html)
- GH-31621 - Fix Union null bitmaps (#37122)
- GH-21815 - Add support for Duration type (#37341)

## v13.0

August 23, 2023

- [Apache Arrow 13.0.0](https://arrow.apache.org/release/13.0.0.html)
- GH-36033 - Remove BigInt compat (#36034)

## v12.0

- [Apache Arrow 12.0.0](https://arrow.apache.org/release/12.0.0.html)
- GH-33681 - Update flatbuffers (#33682)

## v11.0

- [Apache Arrow 11.0.0](https://arrow.apache.org/release/11.0.0.html)
- Apache Arrow JS: No significant changes.

## v10.0

- [Apache Arrow 10.0.0](https://arrow.apache.org/release/10.0.0.html)
- Apache Arrow JS: No significant changes.

## v9.0

- [Apache Arrow 9.0.0](https://arrow.apache.org/release/9.0.0.html)
- Apache Arrow JS: Breaking API changes, see [Upgrade Guide](./upgrade-guide).
- Apache Arrow JS: Smaller, focused, tree-shakeable API.
- Apache Arrow JS: Removes non-core functionality from the Arrow JS library.

## v8.0

- [Apache Arrow 8.0.0](https://arrow.apache.org/release/8.0.0.html)
- Apache Arrow JS: Breaking API changes, see [Upgrade Guide](./upgrade-guide).
- Apache Arrow JS: Smaller, focused, tree-shakeable API.
- Apache Arrow JS: Removes non-core functionality from the Arrow JS library.

## v7.0

- [Apache Arrow 7.0.0](https://arrow.apache.org/release/7.0.0.html)
- Apache Arrow JS: Breaking API changes, see [Upgrade Guide](./upgrade-guide).
- Apache Arrow JS: Smaller, focused, tree-shakeable API.
- Apache Arrow JS: Removes non-core functionality from the Arrow JS library.

## v6.0

- [Apache Arrow 6.0.0](https://arrow.apache.org/release/6.0.0.html)
- Changes in Apache Arrow JS: N/A

## v5.0

- [Apache Arrow 5.0.0](https://arrow.apache.org/release/5.0.0.html)
- Changes in Apache Arrow JS: N/A

## v4.0

- [Apache Arrow 4.0.0](https://arrow.apache.org/release/4.0.0.html)
- Changes in Apache Arrow JS: N/A

## v3.0

- [Apache Arrow 3.0.0](https://arrow.apache.org/release/3.0.0.html)
- Changes in Apache Arrow JS: N/A

## v2.0

- [Apache Arrow 2.0.0](https://arrow.apache.org/release/2.0.0.html)
- Changes in Apache Arrow JS: N/A

## v1.0

- [Apache Arrow 1.0.0](https://arrow.apache.org/release/1.0.0.html)
- Initial version
