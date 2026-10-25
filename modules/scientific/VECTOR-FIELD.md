# Scientific vector fields

Use `@loaders.gl/scientific/vector-field` to normalize a pair of two-dimensional variables from a `ScientificArraySource` into aligned velocity components.

```ts
import {createScientificVectorField} from '@loaders.gl/scientific/vector-field';

const field = await createScientificVectorField(source, {
  eastward: 'eastward_wind',
  northward: 'northward_wind',
  units: 'knots',
  missingValues: [-9999]
});
```

The returned `eastward` and `northward` arrays contain metres per second. `valid` marks cells where both input components are finite and neither is a configured missing value. Missing output components are `NaN`. Input variables must have matching names and lengths for both dimensions, and each data array must match the product of its two dimensions. `selection` is passed to both source reads. Optional `geographic` coordinates are copied to the result; this adapter does not reproject or interpolate a grid.
