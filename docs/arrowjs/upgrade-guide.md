# Upgrade Guide

Unfortunately for JavaScript users, Apache Arrow JS does not publish detailed ugrade guides notes beyond the common [Apache Arrow release notes](https://arrow.apache.org/release/).

Also Apache Arrow JS follows a common cross-language versioning number scheme which leads to frequent major release bumps, that confusingly do not contain any significant JavaScript changes (sometimes a major version bump has no JavaScript changes at all). 

The biggest changes were made in Apache Arrow JS Version 9.0 (based on feedback from loaders.gl users).

## Upgrading to v13.0

- No significant changes in Apache Arrow JS
- [Apache Arrow 13.0.0](https://arrow.apache.org/release/12.0.0.html)

## Upgrading to v12.0

- Under the hood, Apache Arrow JS removed "big int" fallback handling (big ints are now supported by all current browsers and Node.js versions).
- Bug found: Can break table reads in rare cases, e.g when dicts have big int keys.
- [Apache Arrow 12.0.0](https://arrow.apache.org/release/12.0.0.html)

## Upgrading to v11.0

- No significant changes in Apache Arrow JS
- [Apache Arrow 11.0.0](https://arrow.apache.org/release/11.0.0.html)

## Upgrading to v10.0

- No significant changes in Apache Arrow JS
- [Apache Arrow 10.0.0](https://arrow.apache.org/release/10.0.0.html)

## Upgrading to v9.0

- Breaking API changes were made to make the Apache Arrow JS API tree-shakeable. 
- This resolves the complaints from loaders.gl users where even the most simple usage of `ArrowLoader` would lead to ~250KB of Apache Arrow dependencies being bundled.
- Unfortunately applications need to be upgraded and Apache Arrow does not have good release notes.

- [Apache Arrow 9.0.0](https://arrow.apache.org/release/10.0.0.html)

In case it is helpful, changes made to loaders.gl can be found in this [PR](https://github.com/visgl/loaders.gl/pull/2276/files)

## Upgrading to v7.0

In case it is helpful, changes made to loaders.gl can be found in this [PR](https://github.com/visgl/loaders.gl/pull/1931/files)

## Upgrading to v5.0

In case it is helpful, changes made to loaders.gl can be found in this [PR](https://github.com/visgl/loaders.gl/pull/1753/files).
