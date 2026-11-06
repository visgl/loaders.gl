# Binary OpenUSD: initial crate support

The existing USDLoader now detects .usdc and PXR-USDC bytes, including binary-root
stored USDZ archives, and returns the same USDStage hierarchy used for USDA.
Stage format distinguishes usdc from usda and usdz. ASCII support is unchanged.

Initial support is deliberately limited to crate version 0.8.0, ordinary prim and
attribute/relationship specifications, supported scalar/vector/array defaults and
time-sample fields. No rendering objects are created. The decoder is adapted from
THREE.js r187's renderer-free source with retained MIT terms, without any new
package dependency. See src/usd/libs/README.md for local hardening changes.

Unsupported crate versions, dictionaries, value list operations, compound path
list operations, variant specifications and unsupported value encodings fail
explicitly. Binary reference/payload composition is not yet supported; existing
ASCII composition remains available. Numeric 64-bit values outside JavaScript's
safe integer range fail instead of losing precision. Input is limited to 64 MiB
and decoded allocations are bounded. This is not full OpenUSD interoperability.
