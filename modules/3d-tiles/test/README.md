# 3D Tiles Test Coverage

The active `@loaders.gl/3d-tiles` tests use native Vitest assertions and run in Chromium unless a
filename selects another project. Parser tests use local deterministic fixtures and disable workers
when worker behavior is not the subject of the test.

## Recovered coverage

- Composite content containing multiple i3dm tiles is parsed without fetching its external glTF,
  keeping the format-boundary assertion hermetic.
- Oct-encoded i3dm orientation and transformed SSE cases are active regression tests.
- The old FLOAT64 point-cloud skip was removed because its referenced fixture was never checked in.

## Deliberately excluded legacy specifications

`lib/styles/` is a commented CesiumJS specification that depends on Cesium renderer and scene APIs;
it is not an executable loaders.gl test suite. The batch-table hierarchy specification is also
excluded because the production hierarchy implementation is explicitly incomplete and its former
renderer-shaped assertions do not match the current loader output. These should be replaced with
small parser-owned fixtures when those runtime capabilities are implemented, rather than reported
as skipped passing coverage.
