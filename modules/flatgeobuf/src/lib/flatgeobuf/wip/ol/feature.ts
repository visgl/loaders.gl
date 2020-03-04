import { default as OLFeature } from 'ol/Feature'

import { GeometryType } from '../header_generated'
import { Feature, Geometry } from '../feature_generated'
import HeaderMeta from '../HeaderMeta'
import { createGeometryOl } from './geometry'
import { fromFeature as genericFromFeature, IFeature } from '../generic/feature'
import { ISimpleGeometry } from '../generic/geometry'

export function createFeatureOl(geometry: ISimpleGeometry, properties: any): IFeature {
    const feature = new OLFeature(geometry)
    if (properties)
        feature.setProperties(properties)
    return feature
}

export function fromFeature(feature: Feature, header: HeaderMeta): IFeature {
    function createFeature(geometry: ISimpleGeometry, properties: any) {
        return createFeatureOl(geometry, properties)
    }
    function createGeometry(geometry: Geometry, type: GeometryType) {
        return createGeometryOl(geometry, type)
    }
    return genericFromFeature(feature, header, createGeometry, createFeature)
}