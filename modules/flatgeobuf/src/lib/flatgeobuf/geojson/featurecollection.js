import ColumnMeta from '../ColumnMeta'
import ColumnType from '../ColumnType'
import HeaderMeta from '../HeaderMeta'

import { buildFeature, fromFeature, IGeoJsonFeature } from './feature'
import {
    magicbytes,
    buildHeader,
    deserialize as genericDeserialize,
    deserializeStream as genericDeserializeStream,
    deserializeFiltered as genericDeserializeFiltered } from '../generic/featurecollection'
import { toGeometryType } from '../generic/geometry'
import { Rect } from '../packedrtree'

export interface IGeoJsonFeatureCollection {
    type: string,
    features?: IGeoJsonFeature[]
}

export function serialize(featurecollection: IGeoJsonFeatureCollection) {
    const headerMeta = introspectHeaderMeta(featurecollection)
    const header = buildHeader(headerMeta)
    const features: Uint8Array[] = featurecollection.features
        .map(f => buildFeature(f, headerMeta))
    const featuresLength = features
        .map(f => f.length)
        .reduce((a, b) => a + b)
    const uint8 = new Uint8Array(magicbytes.length + header.length + featuresLength)
    uint8.set(header, magicbytes.length)
    let offset = magicbytes.length + header.length
    for (const feature of features) {
        uint8.set(feature, offset)
        offset += feature.length
    }
    uint8.set(magicbytes)
    return uint8
}

export function deserialize(bytes: Uint8Array) {
    const features = genericDeserialize(bytes, (f, h) => fromFeature(f, h))
    return {
        type: 'FeatureCollection',
        features,
    } as IGeoJsonFeatureCollection
}

export function deserializeStream(stream: any) {
    return genericDeserializeStream(stream, (f, h) => fromFeature(f, h))
}

export function deserializeFiltered(url: string, rect: Rect) {
    return genericDeserializeFiltered(url, rect, (f, h) => fromFeature(f, h))
}

function valueToType(value: boolean | number | string | object): ColumnType {
    if (typeof value === 'boolean')
        return ColumnType.Bool
    else if (typeof value === 'number')
        if (value % 1 === 0)
            return ColumnType.Int
        else
            return ColumnType.Double
    else if (typeof value === 'string')
        return ColumnType.String
    else if (value === null)
        return ColumnType.String
    else
        throw new Error(`Unknown type (value '${value}')`)
}

function introspectHeaderMeta(featurecollection: IGeoJsonFeatureCollection) {
    const feature = featurecollection.features[0]
    const properties = feature.properties

    let columns: ColumnMeta[] = null
    if (properties)
        columns = Object.keys(properties)
            .map(k => new ColumnMeta(k, valueToType(properties[k])))

    const geometryTypeNamesSet = new Set()
    for (const f of featurecollection.features)
        geometryTypeNamesSet.add(feature.geometry.type)

    const headerMeta = new HeaderMeta(toGeometryType(feature.geometry.type), columns, featurecollection.features.length)

    return headerMeta
}
