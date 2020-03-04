import { GeometryType } from '../header_generated'
import { Geometry } from '../feature_generated'

import { IParsedGeometry, flat, pairFlatCoordinates, toGeometryType } from '../generic/geometry'

export interface IGeoJsonGeometry {
    type: string
    coordinates: number[] | number[][] | number[][][] | number[][][][]
    geometries?: IGeoJsonGeometry[]
}

export function parseGeometry(geometry: IGeoJsonGeometry): IParsedGeometry;

export function fromGeometry(geometry: Geometry, type: GeometryType): IGeoJsonGeometry;
