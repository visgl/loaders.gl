import { IFeature } from './generic/feature.js';
import OlFeature from 'ol/Feature.js';

import {
    deserialize as fcDeserialize,
    deserializeStream as fcDeserializeStream,
    deserializeFiltered as fcDeserializeFiltered,
    serialize as fcSerialize,
} from './ol/featurecollection.js';
import { HeaderMetaFn } from './generic.js';
import { Rect } from './packedrtree.js';

/**
 * Serialize OpenLayers Features to FlatGeobuf
 * @param features Features to serialize
 */
export function serialize(features: OlFeature[]): Uint8Array {
    const bytes = fcSerialize(features as IFeature[]);
    return bytes;
}

/**
 * Deserialize FlatGeobuf into OpenLayers Features
 * @param input Input byte array, stream or string
 * @param rect Filter rectangle
 * @param headerMetaFn Callback that will recieve header metadata when available
 */
export function deserialize(
    input: Uint8Array | ReadableStream | string,
    rect?: Rect,
    headerMetaFn?: HeaderMetaFn,
): AsyncGenerator<OlFeature> | OlFeature[] {
    if (input instanceof Uint8Array)
        return fcDeserialize(input, headerMetaFn) as OlFeature[];
    else if (input instanceof ReadableStream)
        return fcDeserializeStream(input, headerMetaFn);
    else return fcDeserializeFiltered(input, rect as Rect, headerMetaFn);
}
