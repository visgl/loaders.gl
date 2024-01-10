import { Feature } from '../flat-geobuf/feature.js';
import { Geometry } from '../flat-geobuf/geometry.js';
import HeaderMeta from '../header-meta.js';
import { fromGeometry } from './geometry.js';
import { IFeature, parseProperties } from '../generic/feature.js';

import { Feature as GeoJsonFeature } from 'geojson';

export interface IGeoJsonFeature extends IFeature, GeoJsonFeature {}

export function fromFeature(
    feature: Feature,
    header: HeaderMeta,
): IGeoJsonFeature {
    const columns = header.columns;
    const geometry = fromGeometry(
        feature.geometry() as Geometry,
        header.geometryType,
    );
    const geoJsonfeature: GeoJsonFeature = {
        type: 'Feature',
        geometry,
        properties: parseProperties(feature, columns),
    };
    return geoJsonfeature;
}
