/*
test('BoundingSphere#fromPoints without positions returns an empty sphere', t => {
  const sphere = new BoundingSphere().fromPoints();
  t.equals(sphere.center, Vector3.ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromPoints works with one point', t => {
  const expectedCenter = new Vector3(1.0, 2.0, 3.0);
  const sphere = new BoundingSphere().fromPoints([expectedCenter]);
  t.equals(sphere.center, expectedCenter);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromPoints computes a center from points', t => {
  const sphere = new BoundingSphere().fromPoints(getPositions());
  t.equals(sphere.center, positionsCenter);
  t.equals(sphere.radius, positionsRadius);

  t.end();
});

test('BoundingSphere#fromPoints contains all points (naive)', t => {
  const sphere = new BoundingSphere().fromPoints(getPositions());
  const radius = sphere.radius;
  const center = sphere.center;

  const r = new Vector3(radius, radius, radius);
  const max = Vector3.add(r, center, new Vector3());
  const min = Vector3.subtract(center, r, new Vector3());

  const positions = getPositions();
  const numPositions = positions.length;
  for ( const i = 0; i < numPositions; i++) {
    const currentPos = positions[i];
    t.equals(currentPos.x <= max.x && currentPos.x >= min.x, true);
    t.equals(currentPos.y <= max.y && currentPos.y >= min.y, true);
    t.equals(currentPos.z <= max.z && currentPos.z >= min.z, true);
  }

  t.end();
});

test('BoundingSphere#fromPoints contains all points (ritter)', t => {
  const positions = getPositions();
  positions.push(new Vector3(1, 1, 1), new Vector3(2, 2, 2), new Vector3(3, 3, 3));
  const sphere = BoundingSphere.fromPoints(positions);
  const radius = sphere.radius;
  const center = sphere.center;

  const r = new Vector3(radius, radius, radius);
  const max = Vector3.add(r, center, new Vector3());
  const min = Vector3.subtract(center, r, new Vector3());

  const numPositions = positions.length;
  for ( const i = 0; i < numPositions; i++) {
    const currentPos = positions[i];
    t.equals(currentPos.x <= max.x && currentPos.x >= min.x, true);
    t.equals(currentPos.y <= max.y && currentPos.y >= min.y, true);
    t.equals(currentPos.z <= max.z && currentPos.z >= min.z, true);
  }

  t.end();
});

test('BoundingSphere#fromVertices without positions returns an empty sphere', t => {
  const sphere = BoundingSphere.fromVertices();
  t.equals(sphere.center, Vector3.ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromVertices works with one point', t => {
  const expectedCenter = new Vector3(1.0, 2.0, 3.0);
  const sphere = BoundingSphere.fromVertices([expectedCenter.x, expectedCenter.y, expectedCenter.z]);
  t.equals(sphere.center, expectedCenter);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromVertices computes a center from points', t => {
  const sphere = BoundingSphere.fromVertices(getPositionsAsFlatArray());
  t.equals(sphere.center, positionsCenter);
  t.equals(sphere.radius, positionsRadius);

  t.end();
});

test('BoundingSphere#fromVertices contains all points (naive)', t => {
  const sphere = BoundingSphere.fromVertices(getPositionsAsFlatArray());
  const radius = sphere.radius;
  const center = sphere.center;

  const r = new Vector3(radius, radius, radius);
  const max = Vector3.add(r, center, new Vector3());
  const min = Vector3.subtract(center, r, new Vector3());

  const positions = getPositions();
  const numPositions = positions.length;
  for ( const i = 0; i < numPositions; i++) {
    const currentPos = positions[i];
    t.equals(currentPos.x <= max.x && currentPos.x >= min.x, true);
    t.equals(currentPos.y <= max.y && currentPos.y >= min.y, true);
    t.equals(currentPos.z <= max.z && currentPos.z >= min.z, true);
  }

  t.end();
});

test('BoundingSphere#fromVertices contains all points (ritter)', t => {
  const positions = getPositionsAsFlatArray();
  positions.push(1, 1, 1,  2, 2, 2,  3, 3, 3);
  const sphere = BoundingSphere.fromVertices(positions);
  const radius = sphere.radius;
  const center = sphere.center;

  const r = new Vector3(radius, radius, radius);
  const max = Vector3.add(r, center, new Vector3());
  const min = Vector3.subtract(center, r, new Vector3());

  const numElements = positions.length;
  for (let i = 0; i < numElements; i += 3) {
    t.equals(positions[i] <= max.x && positions[i] >= min.x, true);
    t.equals(positions[i + 1] <= max.y && positions[i + 1] >= min.y, true);
    t.equals(positions[i + 2] <= max.z && positions[i + 2] >= min.z, true);
  }

  t.end();
});

test('BoundingSphere#fromVertices works with a stride of 5', t => {
  const sphere = BoundingSphere.fromVertices(getPositionsAsFlatArrayWithStride5(), undefined, 5);
  t.equals(sphere.center, positionsCenter);
  t.equals(sphere.radius, positionsRadius);

  t.end();
});

test('BoundingSphere#fromVertices works with defined center', t => {
  const center = new Vector3(1.0, 2.0, 3.0);
  const sphere = BoundingSphere.fromVertices(getPositionsAsFlatArrayWithStride5(), center, 5);
  t.equals(sphere.center, Vector3.add(positionsCenter, center, new Vector3()));
  t.equals(sphere.radius, positionsRadius);

  t.end();
});

test('BoundingSphere#fromVertices requires a stride of at least 3', t => {
  function callWithStrideOf2() {
    BoundingSphere.fromVertices(getPositionsAsFlatArray(), undefined, 2);
  }
  expect(callWithStrideOf2).toThrowDeveloperError();

  t.end();
});

test('BoundingSphere#fromVertices fills result parameter if specified', t => {
  const center = new Vector3(1.0, 2.0, 3.0);
  const result = new BoundingSphere();
  const sphere = BoundingSphere.fromVertices(getPositionsAsFlatArrayWithStride5(), center, 5, result);
  t.equals(sphere, result);
  t.equals(result.center, Vector3.add(positionsCenter, center, new Vector3()));
  t.equals(result.radius, positionsRadius);

  t.end();
});

test('BoundingSphere#fromEncodedCartesianVertices without positions returns an empty sphere', t => {
  const sphere = BoundingSphere.fromEncodedCartesianVertices();
  t.equals(sphere.center, Vector3.ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromEncodedCartesianVertices without positions of different lengths returns an empty sphere', t => {
  const positions = getPositionsAsEncodedFlatArray();
  positions.low.length = positions.low.length - 1;
  const sphere = BoundingSphere.fromEncodedCartesianVertices(positions.high, positions.low);
  t.equals(sphere.center, Vector3.ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromEncodedCartesianVertices computes a center from points', t => {
  const positions = getPositionsAsEncodedFlatArray();
  const sphere = BoundingSphere.fromEncodedCartesianVertices(positions.high, positions.low);
  t.equals(sphere.center, positionsCenter);
  t.equals(sphere.radius, positionsRadius);

  t.end();
});

test('BoundingSphere#fromEncodedCartesianVertices contains all points (naive)', t => {
  const positions = getPositionsAsEncodedFlatArray();
  const sphere = BoundingSphere.fromEncodedCartesianVertices(positions.high, positions.low);
  const radius = sphere.radius;
  const center = sphere.center;

  const r = new Vector3(radius, radius, radius);
  const max = Vector3.add(r, center, new Vector3());
  const min = Vector3.subtract(center, r, new Vector3());

  positions = getPositions();
  const numPositions = positions.length;
  for ( const i = 0; i < numPositions; i++) {
    const currentPos = positions[i];
    t.equals(currentPos.x <= max.x && currentPos.x >= min.x, true);
    t.equals(currentPos.y <= max.y && currentPos.y >= min.y, true);
    t.equals(currentPos.z <= max.z && currentPos.z >= min.z, true);
  }

  t.end();
});

test('BoundingSphere#fromEncodedCartesianVertices contains all points (ritter)', t => {
  const positions = getPositionsAsEncodedFlatArray();
  const appendedPositions = [new Vector3(1, 1, 1), new Vector3(2, 2, 2), new Vector3(3, 3, 3)];
  for (let j = 0; j < appendedPositions.length; ++j) {
    const encoded = EncodedVector3.fromCartesian(Vector3.add(appendedPositions[j], center, new Vector3()));
    positions.high.push(encoded.high.x);
    positions.high.push(encoded.high.y);
    positions.high.push(encoded.high.z);
    positions.low.push(encoded.low.x);
    positions.low.push(encoded.low.y);
    positions.low.push(encoded.low.z);
  }

  const sphere = BoundingSphere.fromEncodedCartesianVertices(positions.high, positions.low);
  const radius = sphere.radius;
  const sphereCenter = sphere.center;

  const r = new Vector3(radius, radius, radius);
  const max = Vector3.add(r, sphereCenter, new Vector3());
  const min = Vector3.subtract(sphereCenter, r, new Vector3());

  const numElements = positions.length;
  for (let i = 0; i < numElements; i += 3) {
    t.equals(positions[i] <= max.x && positions[i] >= min.x, true);
    t.equals(positions[i + 1] <= max.y && positions[i + 1] >= min.y, true);
    t.equals(positions[i + 2] <= max.z && positions[i + 2] >= min.z, true);
  }

  t.end();
});

test('BoundingSphere#fromEncodedCartesianVertices fills result parameter if specified', t => {
  const positions = getPositionsAsEncodedFlatArray();
  const result = new BoundingSphere();
  const sphere = BoundingSphere.fromEncodedCartesianVertices(positions.high, positions.low, result);
  t.equals(sphere, result);
  t.equals(result.center, positionsCenter);
  t.equals(result.radius, positionsRadius);

  t.end();
});

test('BoundingSphere#fromRectangle2D creates an empty sphere if no rectangle provided', t => {
  const sphere = BoundingSphere.fromRectangle2D();
  t.equals(sphere.center, Vector3.ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromRectangle2D', t => {
  const rectangle = Rectangle.MAX_VALUE;
  const projection = new GeographicProjection(Ellipsoid.UNIT_SPHERE);
  const expected = new BoundingSphere(Vector3.ZERO, Math.sqrt(rectangle.east * rectangle.east + rectangle.north * rectangle.north));
  t.equals(BoundingSphere.fromRectangle2D(rectangle, projection), expected);

  t.end();
});

test('BoundingSphere#fromRectangle3D creates an empty sphere if no rectangle provided', t => {
  const sphere = BoundingSphere.fromRectangle3D();
  t.equals(sphere.center, Vector3.ZERO);
  t.equals(sphere.radius, 0.0);

  t.end();
});

test('BoundingSphere#fromRectangle3D', t => {
  const rectangle = Rectangle.MAX_VALUE;
  const ellipsoid = Ellipsoid.WGS84;
  const expected = new BoundingSphere(Vector3.ZERO, ellipsoid.maximumRadius);
  t.equals(BoundingSphere.fromRectangle3D(rectangle, ellipsoid), expected);

  t.end();
});

test('BoundingSphere#fromRectangle3D with height', t => {
  const rectangle = new Rectangle(0.1, -0.3, 0.2, -0.4);
  const height = 100000.0;
  const ellipsoid = Ellipsoid.WGS84;
  const points = Rectangle.subsample(rectangle, ellipsoid, height);
  const expected = BoundingSphere.fromPoints(points);
  t.equals(BoundingSphere.fromRectangle3D(rectangle, ellipsoid, height), expected);

  t.end();
});
*/
