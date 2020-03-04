import { flatbuffers } from 'flatbuffers'
import { ReadableStream } from 'web-streams-polyfill/ponyfill'

import { IFeature } from './generic/feature'

import {
    deserialize as fcDeserialize,
    deserializeStream as fcDeserializeStream,
    serialize as fcSerialize
} from './ol/featurecollection'

// NOTE: monkey patch until https://github.com/google/flatbuffers/pull/5326 is mainlined
flatbuffers.SIZE_PREFIX_LENGTH = 4;
flatbuffers.Builder.prototype.finish = function (root_table: any, opt_file_identifier: any, opt_size_prefix: any) {
    var size_prefix = opt_size_prefix ? true : false;
    if (opt_file_identifier) {
        var file_identifier = opt_file_identifier;
        this.prep(this.minalign, flatbuffers.SIZEOF_INT +
            flatbuffers.FILE_IDENTIFIER_LENGTH + (size_prefix ? flatbuffers.SIZE_PREFIX_LENGTH : 0));
        if (file_identifier.length != flatbuffers.FILE_IDENTIFIER_LENGTH) {
            throw new Error('FlatBuffers: file identifier must be length ' +
                flatbuffers.FILE_IDENTIFIER_LENGTH);
        }
        for (var i = flatbuffers.FILE_IDENTIFIER_LENGTH - 1; i >= 0; i--) {
            this.writeInt8(file_identifier.charCodeAt(i));
        }
    }
    this.prep(this.minalign, flatbuffers.SIZEOF_INT + (size_prefix ? flatbuffers.SIZE_PREFIX_LENGTH : 0));
    this.addOffset(root_table);
    if (size_prefix) {
        this.addInt32(this.bb.capacity() - this.space);
    }
    this.bb.setPosition(this.space);
};
flatbuffers.Builder.prototype.finishSizePrefixed = function (root_table: any, opt_file_identifier: any) {
    this.finish(root_table, opt_file_identifier, true);
};

export function serialize(features: IFeature[]) {
    const bytes = fcSerialize(features)
    return bytes
}

export function deserializeStream(stream: ReadableStream) {
    return fcDeserializeStream(stream)
}

export function deserialize(bytes: Uint8Array) {
    const features = fcDeserialize(bytes)
    return features
}
