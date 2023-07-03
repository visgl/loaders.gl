import test from 'tape-promise/tape';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {convertBoundingVolumeToI3SFullExtent} from '../../../src/i3s-converter/helpers/coordinate-converter';
import {Ellipsoid} from '@math.gl/geospatial';

test('tile-converter(i3s-converter)#convertBoundingVolumeToI3SFullExtent', async (t) => {
  const sanFrancisco = [-122.43147634230891, 37.762614422522873, 104.40637177880853];
  const cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(sanFrancisco);
  const mbs = new BoundingSphere([...cartesianCenter, 9669.8994140625], 9669.8994140625);
  const fullExtent = convertBoundingVolumeToI3SFullExtent(mbs);
  t.deepEqual(fullExtent, {
    xmin: -122.46515906068359,
    xmax: -122.39761505291817,
    ymin: 37.620194593759,
    ymax: 37.90522864642682,
    zmin: -4505.453647678357,
    zmax: 4754.999977323874
  });

  const obb = new OrientedBoundingBox().fromCenterHalfSizeQuaternion(
    cartesianCenter,
    [6821.31591796875, 7171.64501953125, 704.45751953125],
    [-0.49739304184913635, 0.74555933475494385, 0.18463276326656342, 0.40330156683921814]
  );
  const fullExtentObb = convertBoundingVolumeToI3SFullExtent(obb);
  t.deepEqual(fullExtentObb, {
    xmin: -122.4660370925878,
    xmax: -122.39672756380504,
    ymin: 37.61647458074144,
    ymax: 37.908958954561705,
    zmin: -4625.401184284537,
    zmax: 4877.104767145071
  });
});
