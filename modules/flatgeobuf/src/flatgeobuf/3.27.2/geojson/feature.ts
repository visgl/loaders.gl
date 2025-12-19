import {Feature} from '../flat-geobuf/feature';
import {Geometry} from '../flat-geobuf/geometry';
import HeaderMeta from '../header-meta';
import {fromGeometry} from './geometry';
import {IFeature, parseProperties} from '../generic/feature';

import {Feature as GeoJsonFeature} from 'geojson';

export interface IGeoJsonFeature extends IFeature, GeoJsonFeature {}

export function fromFeature(feature: Feature, header: HeaderMeta): IGeoJsonFeature {
  const columns = header.columns;
  const geometry = fromGeometry(feature.geometry() as Geometry, header.geometryType);
  const geoJsonfeature: GeoJsonFeature = {
    type: 'Feature',
    geometry,
    properties: parseProperties(feature, columns)
  };
  return geoJsonfeature;
}
