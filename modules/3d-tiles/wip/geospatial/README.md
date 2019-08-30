# @math.gl/geospatial

> This library is being developed to support 3D tiles and will be moved to the math.gl repository when it stabilizes.

This modile provides classes and utilities to facilitate working with the major geospatial coordinate systems and projections used with computer maps, primarily:
- [WGS84](https://en.wikipedia.org/wiki/World_Geodetic_System) (World Geodetic System) coordinates.
- [Web Mercator Projection](https://en.wikipedia.org/wiki/Web_Mercator_projection)

## Class Overview

| Class                   | Dewscription |
| ---                     | --- |
| `Ellipsoid`             | Implements ellipsoid |
| `Ellipsoid.WSG84`       | An `Ellipsoid` instance initialized with Earth radii per WGS84. |
| `CartographicRectangle` | A rectangle defined by cartographic longitudes and latitudes. |

## Usage Examples

A major use of this library is to convert between "cartesian" (`x`, `y`, `z`) and "cartographic" (`longitude`, `latitude`, `height`) representations of WSG84 coordinates. The `Ellipsoid` class implements these calculations.


## Framework Independence

Like all non-core math.gl modules, this library can be used without the math.gl core classes.

- Any input vectors can be supplied as length 3 JavaScript `Array` instances.
- Any result vectors can be treated as length 3 JavaScript `Array` instances (they may be math.gl `Vector3`).
- The core math.gl classes inherit from JavaScript `Array` and can be used directly as input.
