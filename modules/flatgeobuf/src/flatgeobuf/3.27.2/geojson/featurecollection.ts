import ColumnMeta from '../column-meta';
import HeaderMeta from '../header-meta';

import {fromFeature} from './feature';
import {parseGeometry, parseGC} from './geometry';
import {
  buildHeader,
  deserialize as genericDeserialize,
  deserializeStream as genericDeserializeStream,
  deserializeFiltered as genericDeserializeFiltered,
  mapColumn
} from '../generic/featurecollection';
import {Rect} from '../packedrtree';
import {buildFeature, IProperties} from '../generic/feature';
import {HeaderMetaFn} from '../generic';
import {magicbytes} from '../constants';
import {inferGeometryType} from '../generic/header';

import {
  FeatureCollection as GeoJsonFeatureCollection,
  // Point,
  // MultiPoint,
  // LineString,
  // MultiLineString,
  // Polygon,
  // MultiPolygon,
  GeometryCollection
} from 'geojson';

export function serialize(featurecollection: GeoJsonFeatureCollection): Uint8Array {
  const headerMeta = introspectHeaderMeta(featurecollection);
  const header = buildHeader(headerMeta);
  const features: Uint8Array[] = featurecollection.features.map((f) =>
    buildFeature(
      f.geometry.type === 'GeometryCollection'
        ? parseGC(f.geometry as GeometryCollection)
        : parseGeometry(f.geometry),
      f.properties as IProperties,
      headerMeta
    )
  );
  const featuresLength = features.map((f) => f.length).reduce((a, b) => a + b);
  const uint8 = new Uint8Array(magicbytes.length + header.length + featuresLength);
  uint8.set(header, magicbytes.length);
  let offset = magicbytes.length + header.length;
  for (const feature of features) {
    uint8.set(feature, offset);
    offset += feature.length;
  }
  uint8.set(magicbytes);
  return uint8;
}

export function deserialize(
  bytes: Uint8Array,
  headerMetaFn?: HeaderMetaFn
): GeoJsonFeatureCollection {
  const features = genericDeserialize(bytes, fromFeature, headerMetaFn);
  return {
    type: 'FeatureCollection',
    features
  } as GeoJsonFeatureCollection;
}

export function deserializeStream(
  stream: ReadableStream,
  headerMetaFn?: HeaderMetaFn
): AsyncGenerator<any, void, unknown> {
  return genericDeserializeStream(stream, fromFeature, headerMetaFn);
}

export function deserializeFiltered(
  url: string,
  rect: Rect,
  headerMetaFn?: HeaderMetaFn
): AsyncGenerator<any, void, unknown> {
  return genericDeserializeFiltered(url, rect, fromFeature, headerMetaFn);
}

function introspectHeaderMeta(featurecollection: GeoJsonFeatureCollection): HeaderMeta {
  const feature = featurecollection.features[0];
  const properties = feature.properties;

  let columns: ColumnMeta[] | null = null;
  if (properties) columns = Object.keys(properties).map((k) => mapColumn(properties, k));

  const geometryType = inferGeometryType(featurecollection.features);
  const headerMeta: HeaderMeta = {
    geometryType,
    columns,
    envelope: null,
    featuresCount: featurecollection.features.length,
    indexNodeSize: 0,
    crs: null,
    title: null,
    description: null,
    metadata: null
  };

  return headerMeta;
}
