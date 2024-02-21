import {
  Float64 as ArrowFloat,
  FixedSizeList,
  Field as ArrowField,
  List as ArrowList,
  Vector as ArrowVector,
  makeBuilder
} from 'apache-arrow';
import {
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  Feature,
  GeoJsonObject
} from 'geojson';

/**
 * Arrow Field and geometry vector
 */
export type GeoArrowReturnType = {
  field: ArrowField;
  geometry: ArrowVector;
};

// type guard to check if feature is a GeoJSON Feature or Geometry
export function isFeature(json: unknown): json is Feature {
  return Boolean((json as Feature).type === 'Feature');
}

/**
 * Convert GeoJson Features to GeoArrow
 * @param name
 * @param features
 * @returns GeoArrowReturnType
 */
export function geojsonFeaturesToArrow(
  name: string,
  features: Array<Feature | GeoJsonObject>
): GeoArrowReturnType {
  // get the geometry type by iterating all features
  // if one geometry is multi-, then the whole geometry is multi-
  let geometryType = '';
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const geometry = isFeature(feature) ? feature.geometry : feature;
    if (i === 0) {
      geometryType = geometry.type;
    }
    if (geometry.type.includes('Multi')) {
      geometryType = geometry.type;
      break;
    }
  }
  if (geometryType === 'Point') {
    return geojsonPointToArrow(name, features);
  } else if (geometryType === 'MultiPoint') {
    return geojsonMultiPointToArrow(name, features);
  } else if (geometryType === 'LineString') {
    return geojsonLineStringToArrow(name, features);
  } else if (geometryType === 'MultiLineString') {
    return geojsonMultiLineStringToArrow(name, features);
  } else if (geometryType === 'Polygon') {
    return geojsonPolygonToArrow(name, features);
  } else if (geometryType === 'MultiPolygon') {
    return geojsonMultiPolygonToArrow(name, features);
  }
  throw new Error('Unsupported geometry type');
}

/**
 * convert GeoJSON Point to geoarrow
 * @param name geometry field name
 * @param points GeoJSON Points
 * @returns GeoArrowReturnType
 */
export function geojsonPointToArrow(
  name: string,
  points: Array<Feature | GeoJsonObject>
): GeoArrowReturnType {
  const firstPoint = isFeature(points[0]) ? points[0].geometry : points[0];
  // get dimension from the first point
  const dimension = (firstPoint as Point).coordinates.length;
  const pointFieldName = dimension === 2 ? 'xy' : 'xyz';

  // get point type
  const nullable = false;
  const coordType = new ArrowFloat();
  const pointType = new FixedSizeList(
    dimension,
    new ArrowField(pointFieldName, coordType, nullable)
  );

  // create a field
  const metaData: Map<string, string> = new Map([['ARROW:extension:name', 'geoarrow.point']]);
  const field = new ArrowField(name, pointType, nullable, metaData);

  // make geoarrow builder
  const builder = makeBuilder({
    type: pointType,
    nullValues: [null]
  });

  // fill builder with coordinates
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const geometry = isFeature(point) ? point.geometry : point;
    const coords = (geometry as Point).coordinates;
    // @ts-ignore
    builder.append(coords);
  }

  // build geometry vector
  const geometry = builder.finish().toVector();

  return {
    field,
    geometry
  };
}

/**
 * convert GeoJSON Point to arrow.Vector
 */
export function geojsonMultiPointToArrow(
  name: string,
  points: Array<Feature | GeoJsonObject>
): GeoArrowReturnType {
  const firstPoint = isFeature(points[0]) ? points[0].geometry : points[0];
  // get dimension from the first multipoint
  const dimension = (firstPoint as MultiPoint).coordinates[0].length;
  const pointFieldName = dimension === 2 ? 'xy' : 'xyz';

  // get multipoint type
  const nullable = false;
  const coordType = new ArrowFloat();
  const pointType = new FixedSizeList(
    dimension,
    new ArrowField(pointFieldName, coordType, nullable)
  );

  const multiPointType = new ArrowList(new ArrowField('points', pointType, nullable));

  // create a field
  const metaData: Map<string, string> = new Map([['ARROW:extension:name', 'geoarrow.multipoint']]);
  const field = new ArrowField(name, multiPointType, nullable, metaData);

  // make geoarrow builder
  const builder = makeBuilder({
    type: multiPointType,
    nullValues: [null]
  });

  // const pointBuilder = builder.getChildAt(0);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const geometry = isFeature(point) ? point.geometry : point;
    const coords = (geometry as MultiPoint).coordinates;
    // @ts-ignore
    builder.append(coords);
  }

  const geometry = builder.finish().toVector();

  return {
    field,
    geometry
  };
}

/**
 * Convert GeoJSON LineString to arrow.Data
 */
export function geojsonLineStringToArrow(
  name: string,
  lines: Array<Feature | GeoJsonObject>
): GeoArrowReturnType {
  const firstLine = isFeature(lines[0]) ? lines[0].geometry : lines[0];
  // get dimension from the first line
  const dimension = (firstLine as LineString).coordinates[0].length;
  const pointFieldName = dimension === 2 ? 'xy' : 'xyz';

  // get line type
  const nullable = false;
  const coordType = new ArrowFloat();
  const pointType = new FixedSizeList(
    dimension,
    new ArrowField(pointFieldName, coordType, nullable)
  );
  const lineType = new ArrowList(new ArrowField('points', pointType, nullable));

  // create a field
  const metaData: Map<string, string> = new Map([['ARROW:extension:name', 'geoarrow.linestring']]);
  const field = new ArrowField(name, lineType, nullable, metaData);

  // make geoarrow builder
  const builder = makeBuilder({
    type: lineType,
    nullValues: [null]
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const geometry = isFeature(line) ? line.geometry : line;
    const coords = (geometry as LineString).coordinates;
    // @ts-ignore
    builder.append(coords);
  }

  const geometry = builder.finish().toVector();

  return {
    field,
    geometry
  };
}

/**
 * Convert GeoJSON MultiLineString to arrow.Vector
 */
export function geojsonMultiLineStringToArrow(
  name: string,
  lines: Array<Feature | GeoJsonObject>
): GeoArrowReturnType {
  const firstLine = isFeature(lines[0]) ? lines[0].geometry : lines[0];
  // get dimension from the first line
  const dimension = (firstLine as MultiLineString).coordinates[0].length;
  const pointFieldName = dimension === 2 ? 'xy' : 'xyz';

  // get multi-line data type
  const nullable = false;
  const coordType = new ArrowFloat();
  const pointType = new FixedSizeList(
    dimension,
    new ArrowField(pointFieldName, coordType, nullable)
  );
  const lineType = new ArrowList(new ArrowField('points', pointType, nullable));
  const multiLineType = new ArrowList(new ArrowField('lines', lineType, nullable));

  // create a field
  const metaData: Map<string, string> = new Map([
    ['ARROW:extension:name', 'geoarrow.multilinestring']
  ]);
  const field = new ArrowField(name, multiLineType, nullable, metaData);

  // make geoarrow builder
  const builder = makeBuilder({
    type: multiLineType,
    nullValues: [null]
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const geometry = isFeature(line) ? line.geometry : line;
    const coords = (geometry as MultiLineString).coordinates;
    // @ts-ignore
    builder.append(coords);
  }

  const geometry = builder.finish().toVector();

  return {
    field,
    geometry
  };
}

/**
 * Convert GeoJSON Polygon to arrow.Data
 */
export function geojsonPolygonToArrow(
  name: string,
  polygons: Array<Feature | GeoJsonObject>
): GeoArrowReturnType {
  const firstPolygon = isFeature(polygons[0]) ? polygons[0].geometry : polygons[0];
  // get dimension from the first polygon
  const dimension = (firstPolygon as Polygon).coordinates[0][0].length;
  const pointFieldName = dimension === 2 ? 'xy' : 'xyz';

  // get polygon data type
  const nullable = false;
  const coordType = new ArrowFloat();
  const pointType = new FixedSizeList(
    dimension,
    new ArrowField(pointFieldName, coordType, nullable)
  );
  const ringType = new ArrowList(new ArrowField('points', pointType, nullable));
  const polygonType = new ArrowList(new ArrowField('rings', ringType, nullable));

  // create a field
  const metaData = new Map<string, string>([['ARROW:extension:name', 'geoarrow.polygon']]);
  const field = new ArrowField(name, polygonType, nullable, metaData);

  // make geoarrow builder
  const builder = makeBuilder({
    type: polygonType,
    nullValues: [null]
  });

  for (let i = 0; i < polygons.length; i++) {
    const poly = polygons[i];
    const geometry = isFeature(poly) ? poly.geometry : poly;
    const coords = (geometry as Polygon).coordinates;
    // @ts-ignore
    builder.append(coords);
  }

  const geometry = builder.finish().toVector();

  return {
    field,
    geometry
  };
}

// type guard to check if a Geometry is Polygon or MultiPolygon
export function isPolygon(geometry: GeoJsonObject): geometry is Polygon | MultiPolygon {
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon';
}

/**
 * Convert GeoJSON MultiPolygon to arrow.Vector
 */
export function geojsonMultiPolygonToArrow(
  name: string,
  polygons: Array<Feature | GeoJsonObject>
): GeoArrowReturnType {
  const firstPolygon = isFeature(polygons[0]) ? polygons[0].geometry : polygons[0];
  // get dimension from the first polygon
  const dimension =
    (firstPolygon as MultiPolygon).coordinates[0][0][0].length ||
    (firstPolygon as Polygon).coordinates[0][0].length;
  const pointFieldName = dimension === 2 ? 'xy' : 'xyz';

  // get polygon data type
  const nullable = false;
  const coordType = new ArrowFloat();
  const pointType = new FixedSizeList(
    dimension,
    new ArrowField(pointFieldName, coordType, nullable)
  );
  const ringType = new ArrowList(new ArrowField('points', pointType, nullable));
  const polygonType = new ArrowList(new ArrowField('rings', ringType, nullable));
  const multiPolygonType = new ArrowList(new ArrowField('polygons', polygonType, nullable));

  // create a field
  const metaData = new Map<string, string>([['ARROW:extension:name', 'geoarrow.multipolygon']]);
  const field = new ArrowField(name, multiPolygonType, nullable, metaData);

  // make geoarrow builder
  const builder = makeBuilder({
    type: multiPolygonType,
    nullValues: [null]
  });

  for (let i = 0; i < polygons.length; i++) {
    const poly = polygons[i];
    const geometry = isFeature(poly) ? poly.geometry : poly;
    const coords =
      geometry.type === 'MultiPolygon'
        ? (geometry as MultiPolygon).coordinates
        : [(geometry as Polygon).coordinates];
    // @ts-ignore
    builder.append(coords);
  }

  const geometry = builder.finish().toVector();

  return {
    field,
    geometry
  };
}
