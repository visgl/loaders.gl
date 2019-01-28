# @loaders.gl/core

## About Dependencies

The `core` module makes efforts to minimize dependencies, and optimize for tree-shaking. It carefully avoids importing any node modules, both bigger dependencies such as `fs`, but also smaller dependencies such as `path` that are normally transparently polyfilled by the bundler.

## About Node.js support

While all the utilities in the core module are tested under Node.js, the provided loading functions mainly supports browser use cases.

* If you are interested in a set of general file loader/writer functions that work somewhat consistently between browser and Node.js, look at `@loaders.gl/core-io`.
* If you need image loading/encoding functions that workin both browsers and Node.js, look at `@loaders.gl/images`.
