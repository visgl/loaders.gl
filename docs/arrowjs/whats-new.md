# What's New

Unfortunately for JavaScript users, Apache Arrow JS does not publish detailed release notes beyond the common [Apache Arrow release notes](https://arrow.apache.org/release/).

Apache Arrow JS follows the versioning number scheme for the cross-language Apache Arrow
repository releases. 

This results in version numbers that do not follow [semantic versioning](https://semver.org) in the sense that frequent major release bumps are made, without any significant JavaScript changes 
being introduced. 

The frequent major releases can be frustrating to JavaScript package managers (as it is easier to end up bundling two basically equivalent library versions), so some extra attention should be paid to versions if your app uses Apache Arrow.

## v13.0

August 23, 2023

- [Apache Arrow 13.0.0](https://arrow.apache.org/release/13.0.0.html)
- No significant changes in Apache Arrow JS

## v12.0

- [Apache Arrow 12.0.0](https://arrow.apache.org/release/12.0.0.html)
- Apache Arrow JS removed "big int" fallback handling

## v11.0

- [Apache Arrow 11.0.0](https://arrow.apache.org/release/11.0.0.html)
- No significant changes in Apache Arrow JS

## v10.0

- [Apache Arrow 10.0.0](https://arrow.apache.org/release/10.0.0.html)
- No significant changes in Apache Arrow JS

## v9.0

- [Apache Arrow 9.0.0](https://arrow.apache.org/release/10.0.0.html)
- Breaking API changes were made to make the Apache Arrow JS API tree-shakeable. 
- This resolves the complaints from loaders.gl users where even the most simple usage of `ArrowLoader` would lead to ~250KB of Apache Arrow dependencies being bundled.

## v8.0

- [Apache Arrow 8.0.0](https://arrow.apache.org/release/8.0.0.html)
- Changes in Apache Arrow JS: TBD

## v7.0

- [Apache Arrow 7.0.0](https://arrow.apache.org/release/7.0.0.html)
- Changes in Apache Arrow JS: TBD

## v7.0

- [Apache Arrow 7.0.0](https://arrow.apache.org/release/7.0.0.html)
- Changes in Apache Arrow JS: TBD

## v6.0

- [Apache Arrow 6.0.0](https://arrow.apache.org/release/6.0.0.html)
- Changes in Apache Arrow JS: TBD

## v5.0

- [Apache Arrow 5.0.0](https://arrow.apache.org/release/5.0.0.html)
- Changes in Apache Arrow JS: TBD

## v4.0

- [Apache Arrow 4.0.0](https://arrow.apache.org/release/4.0.0.html)
- Changes in Apache Arrow JS: TBD

## v3.0

- [Apache Arrow 3.0.0](https://arrow.apache.org/release/3.0.0.html)
- Changes in Apache Arrow JS: TBD

## v2.0

- [Apache Arrow 2.0.0](https://arrow.apache.org/release/2.0.0.html)
- Changes in Apache Arrow JS: TBD

## v1.0

- [Apache Arrow 1.0.0](https://arrow.apache.org/release/1.0.0.html)
- Initial version
