# What's New

This module is currently in unofficial "soft pre-release" stage. You are welcome to start using this module however be aware that APIs will be slightly fluent until version 1.0 is released.


## loaders.gl Pre-releases

## v0.8

New Features:
* `fetchFile` - New function supports fetch API under browser and Node.js
* `GLTFLoader` - improvements, supports async loading of linked resources and base64 encoded buffer.
* `GLTFParser` - `parse()` now supports the following inputs: ArrayBuffer containg GLB, ArrayBuffer containing UTF8 encoded JSON, string containing JSON as well as decoded JSON.
* `GLTFParser` - API changes: `parse()` now supports linked resource loading and base64 URI decoding.

Breaking Changes:
* `GLTFParser` - API changes: `parse()` is now async and supports linked resource loading, and a separate `parseSync()` method is provided for applications that depend on the old sync behavior and do not need the new features.
 * `GLBBuilder`,`GLTFBuilder` - `nopack` option renamed to `packTypedArrays`. This option must now explicitly be set to `true` to enable packing.


## v0.7

* Arrow batch loader (#96)
* Fix gltf/glbdump publish (#103)
* Initial support for loading from streams (#101)
* Support SVG with loadImage (#98)
* Start using ES2018 syntax, AsyncIterators, alias system to load from webpack dev server (#95)


### v0.5

* `GLBParser`/`GLTFParser` API changes.


### v0.4

* Introducing a unified format (glTF 2.0 based) for loaded mesh and point cloud data. Docs updated.
