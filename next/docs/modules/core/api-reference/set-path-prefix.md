Core API / resource paths

# Resolve relative assets from one known base.

setPathPrefix() supplies a shared prefix for relative paths passed to load functions. It is useful when application data and referenced resources live below a common deployment or CDN base.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Loader options](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)[Resource resolution](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/resource-resolution-and-content-detection.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/resource-resolution-and-content-detection.md)

Path resolution

## Keep resource references portable.

A relative asset path can remain unchanged in a format or application while deployment code supplies the location where that asset is served. The prefix is applied after aliases are resolved.

01

Set

Provide a prefix for relative load and save paths.

02

Resolve

Apply aliases first, then prepend the configured prefix.

03

Inspect

Read the current prefix with getPathPrefix().

04

Clear

Set an empty prefix when resolution should use the original path.

Detailed guide

## Path prefix reference

The detailed reference covers resolvePath(), setPathPrefix(), getPathPrefix(), alias order, and relative versus absolute paths.

### resolvePath(path : String) : String[​](#resolvepathpath--string--string "Direct link to resolvePath(path : String) : String")

Applies aliases and path prefix, in that order. Returns an updated path.

### setPathPrefix(prefix : String)[​](#setpathprefixprefix--string "Direct link to setPathPrefix(prefix : String)")

This sets a path prefix that is automatically prepended to relative path names provided to load functions.

### getPathPrefix() : String[​](#getpathprefix--string "Direct link to getPathPrefix() : String")

Returns the current path prefix set by `setPathPrefix`.
