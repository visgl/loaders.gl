import { GeometryType } from '../header_generated'
import { Geometry } from '../feature_generated'

import { IParsedGeometry, flat, pairFlatCoordinates, toGeometryType } from '../generic/geometry'

export interface IGeoJsonGeometry {
    type: string
    coordinates: number[] | number[][] | number[][][] | number[][][][]
    geometries?: IGeoJsonGeometry[]
}

export function parseGeometry(geometry: IGeoJsonGeometry) {
    const cs = geometry.coordinates
    let xy: number[] = null
    let ends: number[] = null
    let parts: IParsedGeometry[] = null
    let type: GeometryType = toGeometryType(geometry.type)
    let end = 0
    switch (geometry.type) {
        case 'Point':
            xy = cs as number[]
            break
        case 'MultiPoint':
        case 'LineString':
            xy = flat(cs as number[][])
            break
        case 'MultiLineString':
        case 'Polygon':
            const css = cs as number[][][]
            xy = flat(css)
            if (css.length > 1)
                ends = css.map(c => end += c.length)
            break
        case 'MultiPolygon':
            const csss = cs as number[][][][]
            const geometries = csss.map(coordinates => ({ type: 'Polygon', coordinates }))
            parts = geometries.map(parseGeometry)
            break
        case 'GeometryCollection':
            parts = geometry.geometries.map(parseGeometry)
            break
    }
    return {
        xy,
        ends,
        type,
        parts
    } as IParsedGeometry
}

function extractParts(xy: Float64Array, ends: Uint32Array) {
    if (!ends || ends.length === 0)
        return [pairFlatCoordinates(xy)]
    let s = 0
    let xySlices = Array.from(ends)
        .map(e => xy.slice(s, s = e << 1))
    return xySlices
        .map(cs => pairFlatCoordinates(cs))
}

function toGeoJsonCoordinates(geometry: Geometry, type: GeometryType) {
    const xy = geometry.xyArray()
    switch (type) {
        case GeometryType.Point:
            return Array.from(xy)
        case GeometryType.MultiPoint:
        case GeometryType.LineString:
            return pairFlatCoordinates(xy)
        case GeometryType.MultiLineString:
            return extractParts(xy, geometry.endsArray())
        case GeometryType.Polygon:
            return extractParts(xy, geometry.endsArray())
    }
}

export function fromGeometry(geometry: Geometry, type: GeometryType) {
    if (type == GeometryType.GeometryCollection) {
        const geometries = []
        for (let i = 0; i < geometry.partsLength(); i++) {
            const part = geometry.parts(i)
            const partType = part.type()
            geometries.push(fromGeometry(part, partType))
        }
        return {
            type: GeometryType[type],
            geometries
        }
    } else if (type == GeometryType.MultiPolygon) {
        const geometries = []
        for (let i = 0; i < geometry.partsLength(); i++) {
            const part = geometry.parts(i)
            geometries.push(fromGeometry(part, GeometryType.Polygon))
        }
        return {
            type: GeometryType[type],
            coordinates: geometries.map(g => g.coordinates)
        }
    }
    const coordinates = toGeoJsonCoordinates(geometry, type)
    return {
        type: GeometryType[type],
        coordinates
    } as IGeoJsonGeometry
}