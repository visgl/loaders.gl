import test from 'tape-promise/tape';
import {BoundingSphere, OrientedBoundingBox} from '@math.gl/culling';
import {Vector3} from '@math.gl/core';

import {
  getZoomFromBoundingVolume,
  getZoomFromExtent,
  getZoomFromFullExtent
} from '../../../src/tileset/helpers/zoom';
import {Ellipsoid} from '@math.gl/geospatial';

test('Tiles zoom#getZoomFromBoundingVolume', (t) => {
  const cartographicCenter = new Vector3([
    -122.46338343363956, 37.791575759047028, 87.413529296405613
  ]);

  const obb = new OrientedBoundingBox().fromCenterHalfSizeQuaternion(
    [-122.46338343363956, 37.791575759047028, 87.413529296405613],
    [860.66259765625, 1499.0565185546875, 72.744453430175781],
    [0.833251953125, -0.34349745512008667, 0.10557035356760025, -0.42018508911132813]
  );
  const zoomObb = getZoomFromBoundingVolume(obb, cartographicCenter);
  t.equals(zoomObb, 11.772118243173631);

  const mbs = new BoundingSphere(
    [-122.44325696222157, 37.774355586589706, 113.91670957952738],
    9669.8994140625
  );
  const zoomMbs = getZoomFromBoundingVolume(mbs, cartographicCenter);
  t.equals(zoomMbs, 9.347590260591668);

  const frame = {width: 9669.8994140625, height: 9669.8994140625};
  const zoomFrame = getZoomFromBoundingVolume(frame, cartographicCenter);
  t.equals(zoomFrame, 9.365418488216095);
  t.end();
});

test('Tiles zoom#getZoomFromFullExtent', (t) => {
  const cartographicCenter = new Vector3([
    11.592257948984269, 48.13341656355044, 503.87951653264463
  ]);

  const fullExtent = {
    xmin: 11.564421696763986,
    xmax: 11.620110387574517,
    ymin: 48.120129331330034,
    ymax: 48.14669643878373,
    zmin: -10.204441965557635,
    zmax: 1018.8900123462081
  };
  const zoom = getZoomFromFullExtent(
    fullExtent,
    cartographicCenter,
    Ellipsoid.WGS84.cartographicToCartesian(cartographicCenter, new Vector3())
  );
  t.equals(zoom, 11.00143423666113);
  t.end();
});

test('Tiles zoom#getZoomFromExtent', (t) => {
  const cartographicCenter = new Vector3([
    11.592257948984269, 48.13341656355044, 503.87951653264463
  ]);

  const extent: [number, number, number, number] = [
    11.564421696763986, 48.120129331330034, 11.620110387574517, 48.14669643878373
  ];
  const zoom = getZoomFromExtent(
    extent,
    cartographicCenter,
    Ellipsoid.WGS84.cartographicToCartesian(cartographicCenter, new Vector3())
  );
  t.equals(zoom, 11.002543742881027);
  t.end();
});
