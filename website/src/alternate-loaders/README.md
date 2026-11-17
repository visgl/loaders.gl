# Alternate implementations

These unpublished loaders and writers support website benchmarks and independent interoperability tests. Production modules must not import them. Applications use the canonical TypeScript Parquet and LAS implementations through clean format entry points.

Parquet WASM initialization and assets are supplied by the website dependency on `parquet-wasm`. LAS comparison backends and their historical assets live here so they are not included in published pointcloud packages.

The LAS copies retain their original license headers. See [pointcloud attribution](../../../modules/pointclouds/THIRD-PARTY-NOTICES.md) and [Plasio license](../../../modules/pointclouds/third-party-licenses/plasio-LICENSE) for parser lineage and recorded historical attribution gaps.
