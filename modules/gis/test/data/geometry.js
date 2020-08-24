export default [
  {
    binary: {
      positions: {value: new Float32Array([100, 0]), size: 2},
      type: 'Point'
    },
    geoJSON: {
      type: 'Point',
      coordinates: [100, 0]
    }
  },
  {
    binary: {
      positions: {value: new Float32Array([100, 0, 101, 1]), size: 2},
      type: 'Point'
    },
    geoJSON: {
      type: 'MultiPoint',
      coordinates: [[100, 0], [101, 1]]
    }
  },
  {
    binary: {
      positions: {value: new Float32Array([100, 0, 101, 1]), size: 2},
      pathIndices: {value: new Uint16Array([0, 2]), size: 1},
      type: 'LineString'
    },
    geoJSON: {
      type: 'LineString',
      coordinates: [[100, 0], [101, 1]]
    }
  },
  {
    binary: {
      positions: {
        value: new Float32Array([100, 0, 101, 1, 102, 2, 103, 3]),
        size: 2
      },
      pathIndices: {value: new Uint16Array([0, 2, 4]), size: 1},
      type: 'LineString'
    },
    geoJSON: {
      type: 'MultiLineString',
      coordinates: [[[100.0, 0.0], [101.0, 1.0]], [[102.0, 2.0], [103.0, 3.0]]]
    }
  },
  {
    binary: {
      positions: {value: new Float32Array([100, 0, 101, 0, 101, 10, 100, 10, 100, 0]), size: 2},
      polygonIndices: {value: new Uint16Array([0, 5]), size: 1},
      primitivePolygonIndices: {value: new Uint16Array([0, 5]), size: 1},
      type: 'Polygon'
    },
    geoJSON: {
      type: 'Polygon',
      coordinates: [[[100, 0], [101, 0], [101, 10], [100, 10], [100, 0]]]
    }
  },
  {
    binary: {
      positions: {
        // prettier-ignore
        value: new Float32Array([
          100, 0, 110, 0, 110, 10, 100, 10, 100, 0, 108, 8, 108, 2, 102, 2, 102,
          8, 108, 8
        ]),
        size: 2
      },
      polygonIndices: {value: new Uint16Array([0, 10]), size: 1},
      primitivePolygonIndices: {value: new Uint16Array([0, 5, 10]), size: 1},
      type: 'Polygon'
    },
    geoJSON: {
      type: 'Polygon',
      coordinates: [
        [[100, 0], [110, 0], [110, 10], [100, 10], [100, 0]],
        [[108, 8], [108, 2], [102, 2], [102, 8], [108, 8]]
      ]
    }
  },
  {
    binary: {
      positions: {
        // prettier-ignore
        value: new Float32Array([
          102, 20, 103, 20, 103, 30, 102, 30, 102, 20, 100, 0, 110, 0, 110, 10,
          100, 10, 100, 0, 108, 8, 108, 2, 102, 2, 102, 8, 108, 8
        ]),
        size: 2
      },
      polygonIndices: {value: new Uint16Array([0, 5, 15]), size: 1},
      primitivePolygonIndices: {value: new Uint16Array([0, 5, 10, 15]), size: 1},
      type: 'Polygon'
    },
    geoJSON: {
      type: 'MultiPolygon',
      coordinates: [
        [[[102, 20], [103, 20], [103, 30], [102, 30], [102, 20]]],
        [
          [[100, 0], [110, 0], [110, 10], [100, 10], [100, 0]],
          [[108, 8], [108, 2], [102, 2], [102, 8], [108, 8]]
        ]
      ]
    }
  }
];
