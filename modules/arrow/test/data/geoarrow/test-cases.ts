import {FeatureCollection} from '@loaders.gl/schema';

export const POINT_ARROW_FILE = '@loaders.gl/arrow/test/data/geoarrow/point.arrow';
export const MULTIPOINT_ARROW_FILE = '@loaders.gl/arrow/test/data/geoarrow/multipoint.arrow';
export const LINE_ARROW_FILE = '@loaders.gl/arrow/test/data/geoarrow/line.arrow';
export const MULTILINE_ARROW_FILE = '@loaders.gl/arrow/test/data/geoarrow/multiline.arrow';
export const POLYGON_ARROW_FILE = '@loaders.gl/arrow/test/data/geoarrow/polygon.arrow';
export const MULTIPOLYGON_ARROW_FILE = '@loaders.gl/arrow/test/data/geoarrow/multipolygon.arrow';
export const MULTIPOLYGON_HOLE_ARROW_FILE =
  '@loaders.gl/arrow/test/data/geoarrow/multipolygon_hole.arrow';

/** Array containing all encodings */
export const GEOARROW_ENCODINGS = [
  'geoarrow.multipolygon',
  'geoarrow.polygon',
  'geoarrow.multilinestring',
  'geoarrow.linestring',
  'geoarrow.multipoint',
  'geoarrow.point',
  'geoarrow.wkb',
  'geoarrow.wkt'
];

// a simple geojson contains two points
export const expectedPointGeojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'Point',
        coordinates: [1, 1]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'Point',
        coordinates: [2, 2]
      }
    }
  ]
};

// a simple geojson contains two linestrings
export const expectedLineStringGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [2, 2],
          [3, 3]
        ]
      }
    }
  ]
};

// a simple geojson contains two polygons
export const expectedPolygonGeojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [10, 10],
            [10, 11],
            [11, 11],
            [11, 10],
            [10, 10]
          ]
        ]
      }
    }
  ]
};

// a simple geojson contains two MultiPoints
export const expectedMultiPointGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'MultiPoint',
        coordinates: [
          [1, 1],
          [2, 2]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'MultiPoint',
        coordinates: [
          [3, 3],
          [4, 4]
        ]
      }
    }
  ]
};

// a simple geojson contains two MultiLinestrings
export const expectedMultiLineStringGeoJson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [1, 1],
            [2, 2]
          ],
          [
            [3, 3],
            [4, 4]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [5, 5],
            [6, 6]
          ],
          [
            [7, 7],
            [8, 8]
          ]
        ]
      }
    }
  ]
};

// a simple geojson contains one MultiPolygon
export const expectedMultiPolygonGeojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0]
            ]
          ],
          [
            [
              [2, 2],
              [2, 3],
              [3, 3],
              [3, 2],
              [2, 2]
            ]
          ]
        ]
      }
    }
  ]
};

// a simple geojson contains two MultiPolygons with a whole in it
export const expectedMultiPolygonWithHoleGeojson: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 1,
        name: 'name1'
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0]
            ],
            [
              [0.25, 0.25],
              [0.25, 0.75],
              [0.75, 0.75],
              [0.75, 0.25],
              [0.25, 0.25]
            ]
          ],
          [
            [
              [2, 2],
              [2, 3],
              [3, 3],
              [3, 2],
              [2, 2]
            ]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 2,
        name: 'name2'
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [10, 10],
              [10, 11],
              [11, 11],
              [11, 10],
              [10, 10]
            ],
            [
              [10.25, 10.25],
              [10.25, 10.75],
              [10.75, 10.75],
              [10.75, 10.25],
              [10.25, 10.25]
            ]
          ],
          [
            [
              [12, 12],
              [12, 13],
              [13, 13],
              [13, 12],
              [12, 12]
            ]
          ]
        ]
      }
    }
  ]
};

export const GEOARROW_TEST_CASES: [string, FeatureCollection][] = [
  [MULTIPOLYGON_HOLE_ARROW_FILE, expectedMultiPolygonWithHoleGeojson],
  [POINT_ARROW_FILE, expectedPointGeojson],
  [MULTIPOINT_ARROW_FILE, expectedMultiPointGeoJson],
  [LINE_ARROW_FILE, expectedLineStringGeoJson],
  [MULTILINE_ARROW_FILE, expectedMultiLineStringGeoJson],
  [POLYGON_ARROW_FILE, expectedPolygonGeojson],
  [MULTIPOLYGON_ARROW_FILE, expectedMultiPolygonGeojson]
];
