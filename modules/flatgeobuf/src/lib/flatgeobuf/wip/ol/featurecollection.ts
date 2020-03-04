import {
    serialize,
    deserialize as genericDeserialize,
    deserializeStream as genericDeserializeStream } from '../generic/featurecollection'
import { IFeature } from '../generic/feature'
import { fromFeature } from './feature'

export { serialize as serialize }

export function deserialize(bytes: Uint8Array): IFeature[] {
    return genericDeserialize(bytes, (f, h) => fromFeature(f, h))
}

export function deserializeStream(stream: any) {
    return genericDeserializeStream(stream, (f, h) => fromFeature(f, h))
}