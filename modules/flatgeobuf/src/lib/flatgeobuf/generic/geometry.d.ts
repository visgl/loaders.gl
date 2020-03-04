import { flatbuffers } from 'flatbuffers'
import { GeometryType } from '../header_generated'
import { Geometry } from '../feature_generated'

export interface IParsedGeometry {
  xy: number[],
  ends: number[],
  parts: IParsedGeometry[],
  type: GeometryType
}

export interface ISimpleGeometry {
  getFlatCoordinates(): number[]
  getType(): string
}

export interface IPolygon extends ISimpleGeometry {
  getEnds(): number[]
}

export interface IMultiLineString extends ISimpleGeometry {
  getEnds(): number[]
}

export interface IMultiPolygon extends ISimpleGeometry {
  getEndss(): number[][]
  getPolygons(): IPolygon[]
}

export interface ICreateGeometry {
  (geometry: Geometry, type: GeometryType): ISimpleGeometry;
}

export function buildGeometry(builder: flatbuffers.Builder, parsedGeometry: IParsedGeometry);

export function flat(a: any[]): number[];

export function parseGeometry(geometry: ISimpleGeometry, type: GeometryType): IParsedGeometry;

export function pairFlatCoordinates(coordinates: Float64Array): number[][];

export function toGeometryType(name: string): GeometryType;
