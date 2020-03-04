import { flatbuffers } from 'flatbuffers'

import ColumnType from '../ColumnType'
import { Feature, Geometry } from '../feature_generated'
import HeaderMeta from '../HeaderMeta'
import { parseGeometry, fromGeometry } from './geometry'
import { parseProperties } from '../generic/feature'
import { buildGeometry } from '../generic/geometry'

export function buildFeature(feature, header) {
    const columns = header.columns

    const builder = new flatbuffers.Builder(0)

    const propertiesArray = new Uint8Array(100000)
    let offset = 0;
    if (columns) {
        const view = new DataView(propertiesArray.buffer)
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i]
            const value = feature.properties[column.name]
            if (value === null)
                continue
            view.setUint16(offset, i, true)
            offset += 2
            switch (column.type) {
                case ColumnType.Bool:
                    view.setUint8(offset, value as number)
                    offset += 1
                    break
                case ColumnType.Short:
                    view.setInt16(offset, value as number, true)
                    offset += 2
                    break
                case ColumnType.UShort:
                    view.setUint16(offset, value as number, true)
                    offset += 2
                    break
                case ColumnType.Int:
                    view.setInt32(offset, value as number, true)
                    offset += 4
                    break
                case ColumnType.UInt:
                    view.setUint32(offset, value as number, true)
                    offset += 4
                    break
                case ColumnType.Long:
                    view.setBigInt64(offset, BigInt(value), true)
                    offset += 8
                    break
                case ColumnType.Long:
                    view.setBigUint64(offset, BigInt(value), true)
                    offset += 8
                    break
                case ColumnType.Double:
                    view.setFloat64(offset, value as number, true)
                    offset += 8
                    break
                case ColumnType.String:
                    const str = value as string
                    const encoder = new TextEncoder()
                    const stringArray = encoder.encode(str)
                    view.setUint32(offset, stringArray.length, true)
                    offset += 4
                    propertiesArray.set(stringArray, offset)
                    offset += stringArray.length
                    break
                default:
                    throw new Error('Unknown type')
            }
        }
    }
    let propertiesOffset = null
    if (offset > 0)
        propertiesOffset = Feature.createPropertiesVector(builder, propertiesArray.slice(0, offset))

    const geometryOffset = buildGeometry(builder, parseGeometry(feature.geometry))
    Feature.start(builder)
    Feature.addGeometry(builder, geometryOffset)
    if (propertiesOffset)
        Feature.addProperties(builder, propertiesOffset)
    const featureOffset = Feature.end(builder)
    builder.finishSizePrefixed(featureOffset)
    return builder.asUint8Array()
}

export function fromFeature(feature: Feature, header: HeaderMeta) {
    const columns = header.columns
    let geojsonGeometry
    const geometry = feature.geometry()
    geojsonGeometry = fromGeometry(geometry, header.geometryType)
    const geojsonProperties = parseProperties(feature, columns)
    const geoJsonfeature: IGeoJsonFeature = {
        type: 'Feature',
        geometry: geojsonGeometry,
    }
    if (geojsonProperties)
        geoJsonfeature.properties = geojsonProperties

    return geoJsonfeature
}
