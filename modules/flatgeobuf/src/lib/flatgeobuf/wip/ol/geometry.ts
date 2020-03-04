import { GeometryType } from '../header_generated'
import { Geometry } from '../feature_generated'

import { ISimpleGeometry } from '../generic/geometry'

import Point from 'ol/geom/Point'
import MultiPoint from 'ol/geom/MultiPoint'
import LineString from 'ol/geom/LineString'
import MultiLineString from 'ol/geom/MultiLineString'
import Polygon from 'ol/geom/Polygon'
import MultiPolygon from 'ol/geom/MultiPolygon'

const GeometryLayout = {
    XY: 'XY',
    XYZ: 'XYZ',
    XYM: 'XYM',
    XYZM: 'XYZM'
}

export function createGeometryOl(geometry: Geometry, type: GeometryType): ISimpleGeometry {
    const xy = geometry.xyArray() ? Array.from(geometry.xyArray()) : undefined
    const ends = geometry.endsArray()
    let olEnds: number[] | Uint32Array = undefined
    if (xy)
        olEnds = ends ? Array.from(ends.map(e => e << 1)) : new Uint32Array([xy.length])
    switch (type) {
        case GeometryType.Point:
            return new Point(xy)
        case GeometryType.MultiPoint:
            return new MultiPoint(xy, GeometryLayout.XY)
        case GeometryType.LineString:
            return new LineString(xy, GeometryLayout.XY)
        case GeometryType.MultiLineString:
            return new MultiLineString(xy, GeometryLayout.XY, olEnds)
        case GeometryType.Polygon:
            return new Polygon(xy, GeometryLayout.XY, olEnds)
        case GeometryType.MultiPolygon:
            const mp = new MultiPolygon([])
            for (let i = 0; i < geometry.partsLength(); i++)
                mp.appendPolygon(createGeometryOl(geometry.parts(i), GeometryType.Polygon))
            return mp
        default:
            throw Error('Unknown type')
    }
}
