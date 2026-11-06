# Binary USD fixtures

Tiny official OpenUSD test assets, distributed under the retained OpenUSD-LICENSE.txt:

- sphere.usdc and sphere.usda: pxr/usd/bin/usddiff/testenv/testDiffToolVariousUsdFormats/a.usdc and a.usda.
- attributes.usdc: pxr/usdImaging/bin/testusdview/testenv/testUsdviewFileArguments/test.usdc.

Source: https://github.com/PixarAnimationStudios/OpenUSD (dev tree, fetched November 6, 2026).
These fixtures exercise the binary decoder against files produced independently
of loaders.gl; no network access is needed during tests.

triangle.usda is an original MIT-licensed loaders.gl fixture. triangle.usdc was
produced from it with the existing macOS /usr/bin/usdcat CLI (crate 0.8.0), which
is only a fixture-generation tool and is not a runtime or test dependency.

The original siblings.usda/usdc pair exercises authored root and child order.
The original triangle pair also includes unsigned compressed values and a token
array for decoded-limit regressions. Binary counterparts were generated using
usdcat; this is fixture provenance, not a runtime or test dependency.
