import { flatbuffers } from 'flatbuffers'

import ColumnType from '../ColumnType'
import { Feature, Geometry } from '../feature_generated'
import HeaderMeta from '../HeaderMeta'
import { parseGeometry, fromGeometry, IGeoJsonGeometry } from './geometry'
import { parseProperties } from '../generic/feature'
import { buildGeometry } from '../generic/geometry'

export interface IGeoJsonProperties {
  [key: string]: boolean | number | string | object
}

export interface IGeoJsonFeature {
  type: string
  geometry: IGeoJsonGeometry
  properties?: IGeoJsonProperties
}

export function buildFeature(feature: IGeoJsonFeature, header: HeaderMeta): Uint8Array;

export function fromFeature(feature: Feature, header: HeaderMeta): IGeoJsonFeature;
