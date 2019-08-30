# Cartographic

A class with static function to help convert geospatial coordinates, primarily in [WSG84](https://en.wikipedia.org/wiki/World_Geodetic_System) notation, between lng/lat/height and _cartesian_ (earth-center relative `x`,`y`,`z`) coordinates.

## Usage

Convert Cartesian coordinate to longitude/latitude/height-over-ellipsoid.

```js
const lnglatz = Cartographic.fromCartesian([-115.0, 37.0]);
```

Convert longitude/latitude/height-over-ellipsoid to Cartesian:

```js
const position = Cartographic.fromDegrees([-115.0, 37.0]);
```

Convert lng/lat/z with long lat in degrees to radians.

```js
const position = Cartographic.toRadians([-2.007, 0.645]);
```

Convert lng/lat/z with long lat in radians to degrees.

```js
const position = Cartographic.toDegrees([-2.007, 0.645]);
```

## Static Methods

### Cartographic.toRadians([longitude : Number, latitude : Number, height : Number], ellipsoid : Ellipsoid [, result : Number[3]) : Number[3]

Returns a new `Vector3` from longitude and latitude values given in degrees.

- `longitude` The longitude, in degrees
- `latitude` The latitude, in degrees
- `height`=`0.0` The height, in meters, above the ellipsoid.
- `result`= The object onto which to store the result.

### Cartographic.toDegrees([longitudeRadians : Number, latitudeRadians : Number, height : Number], ellipsoid : Ellipsoid [, result : Number[3]]) : Number[3]

Returns a Vector3 position from longitude and latitude values given in radians.

- `longitude` The longitude, in degrees
- `latitude` The latitude, in degrees
- `height`=`0.0` The height, in meters, above the ellipsoid.
- `ellipsoid`=`Ellipsoid.WGS84` The ellipsoid on which the position lies.- `result`= The object onto which to store the result.

### Cartographic.fromCartesian([longitude : Number, latitude : Number, height : Number], ellipsoid : Ellipsoid [, result : Number[3]]) : Number[3]

Converts a Cartesian geodetic position to a longitude/latitude/height vector.

- @param {Vector3} cartesian The Cartesian position to convert to cartographic representation.
- @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the position lies.
- @param {Cartographic} [result] The object onto which to store the result.
- @returns {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.

Returns:

- a lng, lat, height from a Cartesian position. The values in the resulting object will be in radians.

- `cartesian` The Cartesian position to convert to cartographic representation.
- `ellipsoid`=`Ellipsoid.WGS84` The ellipsoid on which the position lies.
- `result` The object onto which to store the result.

Returns:

- Array of 3 numbers. The modified result parameter, a new vector if none was provided, or `undefined` if the cartesian is at the center of the ellipsoid.

### Cartographic.toCartesian([longitude : Number, latitude : Number, height : Number], ellipsoid : Ellipsoid [, result : Number[3]]) : Number[3]

Converts a lng/lat/height into a Cartesian position on the given ellipsoid.

- `cartesian` The Cartesian position to convert to cartographic representation.
- `ellipsoid`=`Ellipsoid.WGS84` The ellipsoid on which the position lies.
- `result` The object onto which to store the result.

Returns:

- The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.

The values in the resulting object will be in degrees.

## Attribution

This class is based on [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) source code under the Apache 2 License.
