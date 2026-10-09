# loaders.gl

<p align="center">
  <img src="https://badge.fury.io/js/%40loaders.gl%2Fcore.svg" />
  <img src="https://flat.badgen.net/badge/icon/Typed?icon=typescript&label&labelColor=blue&color=555555)" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
  <img src="https://img.shields.io/npm/dm/@loaders.gl/core.svg" />
  <br />
</p>

[loaders.gl](https://loaders.gl) is a collection of framework-independent loaders for geospatial, 3D, and large-data visualization, part of [vis.gl](https://vis.gl).

## Documentation

loaders.gl is extensively documented on the [loaders.gl](https://loaders.gl) website.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Build and test workflows

- Run `yarn install` to install workspace dependencies.
- Run `yarn build` to build the modules, then `yarn build-workers` to generate worker bundles. Rebuild workers after each module build.
- Run `yarn test-node` for Node.js tests and `yarn test-headless` for Chromium tests, or `yarn test` for both.
- Run `yarn lint fix` to apply lint and formatting fixes.
- Run `yarn test-website` to install website dependencies and build the documentation site.

- Run `yarn build-apps` to run the tile-converter app build (currently the only app in this repository).
- Run `yarn test-apps` to exercise the tile-converter app test/build script when available.

See the [development environment guide](docs/developer-guide/dev-env.md) for runtime requirements and browser setup.

## License

loaders.gl uses the MIT license.

Some individual loaders are forked from other open source code bases that are licensed under different but compatible permissive licenses such as Apache 2 or BSD.

No code that uses proprietary, copy-left or non-permissive licenses is included in loaders.gl.

You can check the "Attributions" section for each loader module before you install it if the details matter to you.
