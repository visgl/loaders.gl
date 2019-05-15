# BoundingSphere

A bounding sphere with a center and a radius.
/\*

## Usage

Sort bounding spheres from back to front

```js
spheres.sort(
  (a, b) => b.distanceSquaredTo(b, camera.positionWC) - a.distanceSquaredTo(a.camera.positionWC)
);
```

Create a bounding sphere around the unit cube

```js
var sphere = new BoundingSphere.fromCornerPoints(
  new Cesium.Cartesian3(-0.5, -0.5, -0.5),
  new Cesium.Cartesian3(0.5, 0.5, 0.5)
);
```

Creates a bounding sphere encompassing an ellipsoid.

```js
var boundingSphere = Cesium.BoundingSphere.fromEllipsoid(ellipsoid);
```

## Fields

### center : Vector3

// The center point of the sphere.
// @default {@link Cartesian3.ZERO}

### radius : Number

// The radius of the sphere.
// @default 0.0

## Members

### constructor

// @param {Cartesian3} [center=Cartesian3.ZERO] The center of the bounding sphere.
// @param {Number} [radius=0.0] The radius of the bounding sphere.
// \*
// @see AxisAlignedBoundingBox
// @see BoundingRectangle
// @see Packable

Computes a tight-fitting bounding sphere enclosing the provided oriented bounding box. \*
@param {OrientedBoundingBox} orientedBoundingBox The oriented bounding box.
@param {BoundingSphere} [result] The object onto which to store the result.
@returns {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
