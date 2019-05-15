# Cartographic

A class with static function to help convert geospatial coordinates, primarily in WSG84 notation.

## Usage

```js
var position = Cartographic.fromDegrees([-115.0, 37.0]);
```

```js
var position = Cartographic.fromRadians([-2.007, 0.645]);
```

## Static Methods

### Cartographic.degreesToPosition([longitude : Number, latitude : Number, height : Number], ellipsoid : Ellipsoid, result : Vector3) : Vector3

Returns a Vector3 position from longitude and latitude values given in degrees.

- `longitude` The longitude, in degrees
- `latitude` The latitude, in degrees
- `height`=`0.0` The height, in meters, above the ellipsoid.
- `ellipsoid`=`Ellipsoid.WGS84` The ellipsoid on which the position lies.
- `result`= The object onto which to store the result.

### Cartographic.radiansToPosition([longitude : Number, latitude : Number, height : Number], ellipsoid : Ellipsoid, result : Vector3) : Vector3

Returns a Vector3 position from longitude and latitude values given in radians.

- `longitude` The longitude, in degrees
- `latitude` The latitude, in degrees
- `height`=`0.0` The height, in meters, above the ellipsoid.
- `ellipsoid`=`Ellipsoid.WGS84` The ellipsoid on which the position lies.
- `result`= The object onto which to store the result.

### Cartographic.positionToDegrees

Creates a new Cartographic instance from a Cartesian position. The values in the
resulting object will be in radians.

- cartesian The Cartesian position to convert to cartographic representation.
- [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
- [result] The object onto which to store the result.
  @returns {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.

## Attribution

This class was ported from Cesium under the Apache 2 License.
