# @math.gl/culling

> This library is being developed to support 3D tiles and will be moved to the math.gl repository when it stabilizes.

The culling module provides primitives for implementing frustum culling.

- It does provides fully "transformable" primitives (i.e. oriented bounding boxes as opposed to just axis-aligned bounding boxes).
- It does not attempt to be a general collision detection library (i.e. does not handle time-interpolated intersections).


## Classes

| Class                 | Description |
| ---                   | --- |
| `CullingVolume`       | |
| `BoundingSphere`      | |
| `OrientedBoundingBox` | |
| `Plane`               | |

## Example Usage

- Create bounding volumes for your objects/geometries, and create `BoundingSphere` or `OrientedBoundingBox` instances.
- Extract your camera view frustum parameters and create a `PerspectiveFrustum` instance.
- You can now test your bounding volumes to see if the intersect the view frustum.


## Framework Independence

Like all non-core math.gl modules, this library can be used without the math.gl core classes.

- Any input vectors can be supplied as length 3 JavaScript `Array` instances.
- Any result vectors can be treated as length 3 JavaScript `Array` instances (they may be math.gl `Vector3`).
- The core math.gl classes inherit from JavaScript `Array` and can be used directly as input.


## Roadmap

- Support Orthographic Culling
