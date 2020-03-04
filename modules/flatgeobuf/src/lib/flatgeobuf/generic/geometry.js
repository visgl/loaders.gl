import { flatbuffers } from 'flatbuffers'
import { GeometryType } from '../header_generated'
import { Geometry } from '../feature_generated'

export function buildGeometry(builder, parsedGeometry) {
    const { xy, ends, parts, type } = parsedGeometry

    if (parts) {
        const partOffsets = parts.map(part => buildGeometry(builder, part))
        const partsOffset = Geometry.createPartsVector(builder, partOffsets)
        Geometry.start(builder)
        Geometry.addParts(builder, partsOffset)
        return Geometry.end(builder)
    }

    const coordsOffset = Geometry.createXyVector(builder, xy)

    /** @type {number} */
    let endsOffset = null
    if (ends)
        endsOffset = Geometry.createEndsVector(builder, ends)

    Geometry.start(builder)
    if (endsOffset)
        Geometry.addEnds(builder, endsOffset)
    Geometry.addXy(builder, coordsOffset)
    Geometry.addType(builder, type)
    return Geometry.end(builder)
}

export function flat(a) {
    return a.reduce((acc, val) =>
        Array.isArray(val) ? acc.concat(flat(val)) : acc.concat(val), [])
}

export function parseGeometry(geometry: ISimpleGeometry, type: GeometryType) {
    let xy: number[] = null
    let ends: number[] = null
    let parts: IParsedGeometry[] = null
    if (type === GeometryType.MultiLineString) {
        xy = geometry.getFlatCoordinates()
        const mlsEnds = (geometry as IMultiLineString).getEnds()
        if (mlsEnds.length > 1)
            ends = mlsEnds.map(e => e >> 1)
    } else if (type === GeometryType.Polygon) {
        xy = geometry.getFlatCoordinates()
        const pEnds = (geometry as IPolygon).getEnds()
        if (pEnds.length > 1)
            ends = pEnds.map(e => e >> 1)
    } else if (type === GeometryType.MultiPolygon) {
        const mp = (geometry as IMultiPolygon)
        parts = mp.getPolygons().map(p => parseGeometry(p, GeometryType.Polygon))
    } else {
        xy = geometry.getFlatCoordinates()
    }
    return {
        xy,
        ends,
        type,
        parts
    } as IParsedGeometry
}

export function pairFlatCoordinates(coordinates: Float64Array) {
    const newArray: number[][] = []
    for (let i = 0; i < coordinates.length; i += 2)
        newArray.push([coordinates[i], coordinates[i + 1]])
    return newArray
}

export function toGeometryType(name) {
    const type: GeometryType = (GeometryType as any)[name]
    return type
}
