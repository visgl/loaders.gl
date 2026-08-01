# OpenUSD

[OpenUSD](https://openusd.org/release/index.html) describes hierarchical 3D scenes in text and
binary layer formats. The initial loaders.gl implementation supports:

- ASCII `.usda` layers and ASCII content stored with a `.usd` extension
- Uncompressed `.usdz` ZIP archives whose root layer is ASCII
- External and packaged references, payloads, authored variants, and local overrides

Binary USDC crate layers, compressed ZIP entries, and the complete OpenUSD composition semantics
are not yet supported.
