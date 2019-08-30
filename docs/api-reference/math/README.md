# @loaders.gl/math

> This library is being developed to support 3D tiles and will be moved to the math.gl repository when it stabilizes.

Classes and utilities to help working with geometries (arrays of vertices) stored in typed arrays according to WebGL/OpenGL layout rules.

## Usage Examples

## Framework Independence

Like all non-core math.gl modules, this library can be used without the math.gl core classes.

- Any input vectors can be supplied as length 3 JavaScript `Array` instances.
- Any result vectors can be treated as length 3 JavaScript `Array` instances (they may be math.gl `Vector3`).
- The core math.gl classes inherit from JavaScript `Array` and can be used directly as input.
