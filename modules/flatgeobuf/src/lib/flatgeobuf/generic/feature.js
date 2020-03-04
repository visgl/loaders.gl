import { flatbuffers } from 'flatbuffers'

import ColumnMeta from '../ColumnMeta'
import ColumnType from '../ColumnType'
import { Feature, Geometry } from '../feature_generated'
import HeaderMeta from '../HeaderMeta'
import { buildGeometry, parseGeometry, ISimpleGeometry, ICreateGeometry } from './geometry'

export interface IFeature {
    getGeometry(): ISimpleGeometry
    getProperties(): any
}

export interface ICreateFeature {
    (geometry: ISimpleGeometry, properties: any): IFeature;
}

export function fromFeature(
        feature: Feature,
        header: HeaderMeta,
        createGeometry: ICreateGeometry,
        createFeature: ICreateFeature) {
    const columns = header.columns
    const geometry = feature.geometry()
    const simpleGeometry = createGeometry(geometry, header.geometryType)
    const properties = parseProperties(feature, columns)
    return createFeature(simpleGeometry, properties)
}

export function buildFeature(feature: IFeature, header: HeaderMeta) {
    const columns = header.columns
    const builder = new flatbuffers.Builder(0)
    const propertiesArray = new Uint8Array(100000)
    let offset = 0;
    if (columns) {
        const view = new DataView(propertiesArray.buffer)
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i]
            const value = feature.getProperties()[column.name]
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
                case ColumnType.DateTime:
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
                    throw new Error('Unknown type ' + column.type)
            }
        }
    }

    let propertiesOffset = null
    if (offset > 0)
        propertiesOffset = Feature.createPropertiesVector(builder, propertiesArray.slice(0, offset))

    const geometryOffset = buildGeometry(builder, parseGeometry(feature.getGeometry(), header.geometryType))
    Feature.start(builder)
    Feature.addGeometry(builder, geometryOffset)
    if (propertiesOffset)
        Feature.addProperties(builder, propertiesOffset)
    const featureOffset = Feature.end(builder)
    builder.finishSizePrefixed(featureOffset)
    return builder.asUint8Array()
}

export function parseProperties(feature: Feature, columns: ColumnMeta[]) {
    if (!columns || columns.length === 0)
        return
    const array = feature.propertiesArray()
    const view = new DataView(array.buffer, array.byteOffset)
    const length = feature.propertiesLength()
    let offset = 0
    const properties: any = {}
    while (offset < length) {
        const i = view.getUint16(offset, true)
        offset += 2
        const column = columns[i]
        switch (column.type) {
            case ColumnType.Bool: {
                properties[column.name] = !!view.getUint8(offset)
                offset += 1
                break
            }
            case ColumnType.Byte: {
                properties[column.name] = view.getInt8(offset)
                offset += 1
                break
            }
            case ColumnType.UByte: {
                properties[column.name] = view.getUint8(offset)
                offset += 1
                break
            }
            case ColumnType.Short: {
                properties[column.name] = view.getInt16(offset, true)
                offset += 2
                break
            }
            case ColumnType.UShort: {
                properties[column.name] = view.getUint16(offset, true)
                offset += 2
                break
            }
            case ColumnType.Int: {
                properties[column.name] = view.getInt32(offset, true)
                offset += 4
                break
            }
            case ColumnType.UInt: {
                properties[column.name] = view.getUint32(offset, true)
                offset += 4
                break
            }
            case ColumnType.Long: {
                properties[column.name] = Number(view.getBigInt64(offset, true))
                offset += 8
                break
            }
            case ColumnType.ULong: {
                properties[column.name] = Number(view.getBigUint64(offset, true))
                offset += 8
                break
            }
            case ColumnType.Double: {
                properties[column.name] = view.getFloat64(offset, true)
                offset += 8
                break
            }
            case ColumnType.DateTime:
            case ColumnType.String: {
                const length = view.getUint32(offset, true)
                offset += 4
                const decoder = new TextDecoder()
                properties[column.name] = decoder.decode(array.subarray(offset, offset + length))
                offset += length
                break
            }
            default:
                throw new Error('Unknown type ' + column.type)
        }
    }
    return properties
}
