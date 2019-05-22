# CullingVolume

A culling volume defined by planes.

## Static Members

#### CullingVolume.MASK_OUTSIDE

For plane masks (as used in `CullingVolume#computeVisibilityWithPlaneMask`), this special value represents the case where the object bounding volume is entirely outside the culling volume.

#### CullingVolume.MASK_INSIDE

For plane masks (as used in `CullingVolume.computeVisibilityWithPlaneMask`), this value represents the case where the object bounding volume is entirely inside the culling volume.

#### CullingVolume.MASK_INDETERMINATE

For plane masks (as used in`CullingVolume.computeVisibilityWithPlaneMask`), this value represents the case where the object bounding volume (may) intersect all planes of the culling volume.

## Methods

#### constructor([planes : Plane[]])

- `planes`=`[]` An array of clipping planes.

Each plane is represented by a Cartesian4 object, where the x, y, and z components define the unit vector normal to the plane, and the w component is the distance of the plane from the origin.

#### fromBoundingSphere(boundingSphere : BoundingSphere)

Constructs a culling volume from a bounding sphere. Creates six planes that create a box containing the sphere. The planes are aligned to the x, y, and z axes in world coordinates.

- `boundingSphere` The bounding sphere used to create the culling volume.

### computeVisibility(boundingVolume : Object) : Interset

Determines whether a bounding volume intersects the culling volume.

- `boundingVolume` The bounding volume whose intersection with the culling volume is to be tested.

Returns
- `Intersect.OUTSIDE`, `Intersect.INTERSECTING`, or `Intersect.INSIDE`.

### computeVisibilityWithPlaneMask(boundingVolume : Object, parentPlaneMask : Number) : Number

Determines whether a bounding volume intersects the culling volume.

- `boundingVolume` The bounding volume whose intersection with the culling volume is to be tested.
- `parentPlaneMask` A bit mask from the boundingVolume's parent's check against the same culling volume, such that if `planeMask & (1 << planeIndex) === 0`, for `k < 31`, then the parent (and therefore this) volume is completely inside `plane[planeIndex]` and that plane check can be skipped.

Returns
- A plane mask as described above (which can be applied to this boundingVolume's children).

## Attribution

This class was ported from [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) under the Apache 2 License.
