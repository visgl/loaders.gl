import * as flatbuffers from 'flatbuffers';
import { Repeater } from '@repeaterjs/repeater';

import {
    Rect,
    calcTreeSize,
    DEFAULT_NODE_SIZE,
    NODE_ITEM_BYTE_LEN,
    streamSearch,
} from './packedrtree.js';
import { magicbytes, SIZE_PREFIX_LEN } from './constants.js';
import Config from './config.js';
import Logger from './logger.js';
import HeaderMeta, { fromByteBuffer } from './header-meta.js';
import { Feature } from './flat-geobuf/feature.js';

export class HttpReader {
    private headerClient: BufferedHttpRangeClient;
    public header: HeaderMeta;
    private headerLength: number;
    private indexLength: number;

    constructor(
        headerClient: BufferedHttpRangeClient,
        header: HeaderMeta,
        headerLength: number,
        indexLength: number,
    ) {
        this.headerClient = headerClient;
        this.header = header;
        this.headerLength = headerLength;
        this.indexLength = indexLength;
    }

    // Fetch the header, preparing the reader to read Feature data.
    //
    // and potentially some opportunistic fetching of the index.
    static async open(url: string): Promise<HttpReader> {
        // In reality, the header is probably less than half this size, but
        // better to overshoot and fetch an extra kb rather than have to issue
        // a second request.
        const assumedHeaderLength = 2024;

        const headerClient = new BufferedHttpRangeClient(url);

        // Immediately following the header is the optional spatial index, we deliberately fetch
        // a small part of that to skip subsequent requests.
        const assumedIndexLength = (() => {
            // The actual branching factor will be in the header, but since we
            // don't have the header yet, we just guess. The consequence of
            // getting this wrong isn't terminal, it only means we may be
            // fetching slightly more than we need or that we need to make an
            // extra request later.
            const assumedBranchingFactor = DEFAULT_NODE_SIZE;

            // NOTE: each layer is exponentially larger
            const prefetchedLayers = 3;

            let result = 0;
            let i: number;
            for (i = 0; i < prefetchedLayers; i++) {
                const layer_width =
                    assumedBranchingFactor ** i * NODE_ITEM_BYTE_LEN;
                result += layer_width;
            }
            return result;
        })();

        const minReqLength = assumedHeaderLength + assumedIndexLength;
        Logger.debug(
            `fetching header. minReqLength: ${minReqLength} (assumedHeaderLength: ${assumedHeaderLength}, assumedIndexLength: ${assumedIndexLength})`,
        );

        {
            const bytes = new Uint8Array(
                await headerClient.getRange(0, 8, minReqLength, 'header'),
            );
            if (!bytes.subarray(0, 3).every((v, i) => magicbytes[i] === v)) {
                Logger.error(`bytes: ${bytes} != ${magicbytes}`);
                throw new Error('Not a FlatGeobuf file');
            }
            Logger.debug('magic bytes look good');
        }

        let headerLength: number;
        {
            const bytes = await headerClient.getRange(
                8,
                4,
                minReqLength,
                'header',
            );
            headerLength = new DataView(bytes).getUint32(0, true);
            const HEADER_MAX_BUFFER_SIZE = 1048576 * 10;
            if (headerLength > HEADER_MAX_BUFFER_SIZE || headerLength < 8) {
                // minimum size check avoids panic in FlatBuffers header decoding
                throw new Error('Invalid header size');
            }
            Logger.debug(`headerLength: ${headerLength}`);
        }

        const bytes = await headerClient.getRange(
            12,
            headerLength,
            minReqLength,
            'header',
        );
        const bb = new flatbuffers.ByteBuffer(new Uint8Array(bytes));
        const header = fromByteBuffer(bb);

        const indexLength = calcTreeSize(
            header.featuresCount,
            header.indexNodeSize,
        );

        Logger.debug('completed: opening http reader');
        return new HttpReader(headerClient, header, headerLength, indexLength);
    }

    async *selectBbox(rect: Rect): AsyncGenerator<Feature, void, unknown> {
        // Read R-Tree index and build filter for features within bbox
        const lengthBeforeTree = this.lengthBeforeTree();

        const bufferedClient = this.headerClient;
        const readNode = async function (
            offsetIntoTree: number,
            size: number,
        ): Promise<ArrayBuffer> {
            const minReqLength = 0;
            return bufferedClient.getRange(
                lengthBeforeTree + offsetIntoTree,
                size,
                minReqLength,
                'index',
            );
        };

        const batches: [number, number][][] = [];
        let currentBatch: [number, number][] = [];
        for await (const searchResult of streamSearch(
            this.header.featuresCount,
            this.header.indexNodeSize,
            rect,
            readNode,
        )) {
            const [featureOffset, ,] = searchResult;
            let [, , featureLength] = searchResult;
            if (!featureLength) {
                Logger.info('final feature');
                // Normally we get the feature length by subtracting between
                // adjacent nodes from the index, which we can't do for the
                // _very_ last feature in a dataset.
                //
                // We could *guess* the size, but we'd risk overshooting the length,
                // which will cause some webservers to return HTTP 416: Unsatisfiable range
                //
                // So instead we fetch only the final features byte length, stored in the
                // first 4 bytes.
                featureLength = 4;
            }

            if (currentBatch.length == 0) {
                currentBatch.push([featureOffset, featureLength]);
                continue;
            }

            const prevFeature = currentBatch[currentBatch.length - 1];
            const gap = featureOffset - (prevFeature[0] + prevFeature[1]);
            if (gap > Config.global.extraRequestThreshold()) {
                Logger.info(
                    `Pushing new feature batch, since gap ${gap} was too large`,
                );
                batches.push(currentBatch);
                currentBatch = [];
            }

            currentBatch.push([featureOffset, featureLength]);
        }
        this.headerClient.logUsage('header+index');
        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }

        const promises: AsyncGenerator<Feature, any, any>[] = batches.flatMap(
            (batch: [number, number][]) => this.readFeatureBatch(batch),
        );

        // Fetch all batches concurrently, yielding features as they become
        // available, meaning the results may be intermixed.
        yield* Repeater.merge(promises);
    }

    lengthBeforeTree(): number {
        // FGB Layout is: [magicbytes (fixed), headerLength (i32), header (variable), Tree (variable), Features (variable)]
        return magicbytes.length + SIZE_PREFIX_LEN + this.headerLength;
    }

    lengthBeforeFeatures(): number {
        return this.lengthBeforeTree() + this.indexLength;
    }

    buildFeatureClient(): BufferedHttpRangeClient {
        return new BufferedHttpRangeClient(this.headerClient.httpClient);
    }

    /**
     * Fetch a batch of features in a single request, yielding each Feature
     *
     * `batch`: [offset, length] of features in the batch
     */
    async *readFeatureBatch(
        batch: [number, number][],
    ): AsyncGenerator<Feature, void, unknown> {
        const [firstFeatureOffset] = batch[0];
        const [lastFeatureOffset, lastFeatureLength] = batch[batch.length - 1];

        const batchStart = firstFeatureOffset;
        const batchEnd = lastFeatureOffset + lastFeatureLength;
        const batchSize = batchEnd - batchStart;

        // A new feature client is needed for each batch to own the underlying buffer as features are yielded.
        const featureClient = this.buildFeatureClient();

        let minFeatureReqLength = batchSize;
        for (const [featureOffset] of batch) {
            yield await this.readFeature(
                featureClient,
                featureOffset,
                minFeatureReqLength,
            );
            // Only set minFeatureReqLength for the first request.
            //
            // This should only affect a batch that contains the final feature, otherwise
            // we've calculated `batchSize` to get all the data we need for the batch.
            // For the very final feature in a dataset, we don't know it's length, so we
            // will end up executing an extra request for that batch.
            minFeatureReqLength = 0;
        }
        featureClient.logUsage('feature');
    }

    async readFeature(
        featureClient: BufferedHttpRangeClient,
        featureOffset: number,
        minFeatureReqLength: number,
    ): Promise<Feature> {
        const offset = featureOffset + this.lengthBeforeFeatures();

        let featureLength: number;
        {
            const bytes = await featureClient.getRange(
                offset,
                4,
                minFeatureReqLength,
                'feature length',
            );
            featureLength = new DataView(bytes).getUint32(0, true);
        }

        const byteBuffer = await featureClient.getRange(
            offset + 4,
            featureLength,
            minFeatureReqLength,
            'feature data',
        );
        const bytes = new Uint8Array(byteBuffer);
        const bytesAligned = new Uint8Array(featureLength + SIZE_PREFIX_LEN);
        bytesAligned.set(bytes, SIZE_PREFIX_LEN);
        const bb = new flatbuffers.ByteBuffer(bytesAligned);
        bb.setPosition(SIZE_PREFIX_LEN);
        return Feature.getRootAsFeature(bb);
    }
}

class BufferedHttpRangeClient {
    httpClient: HttpRangeClient;
    bytesEverUsed = 0;
    bytesEverFetched = 0;

    private buffer: ArrayBuffer = new ArrayBuffer(0);

    // Byte offset of `buffer` with respect to the beginning of the file being
    // buffered
    private head = 0;

    constructor(source: string | HttpRangeClient) {
        if (typeof source === 'string') {
            this.httpClient = new HttpRangeClient(source);
        } else if (source instanceof HttpRangeClient) {
            this.httpClient = source;
        } else {
            throw new Error('Unknown source ');
        }
    }

    async getRange(
        start: number,
        length: number,
        minReqLength: number,
        purpose: string,
    ): Promise<ArrayBuffer> {
        this.bytesEverUsed += length;

        const start_i = start - this.head;
        const end_i = start_i + length;
        if (start_i >= 0 && end_i <= this.buffer.byteLength) {
            return this.buffer.slice(start_i, end_i);
        }

        const lengthToFetch = Math.max(length, minReqLength);

        this.bytesEverFetched += lengthToFetch;
        Logger.debug(
            `requesting for new Range: ${start}-${start + lengthToFetch - 1}`,
        );
        this.buffer = await this.httpClient.getRange(
            start,
            lengthToFetch,
            purpose,
        );
        this.head = start;

        return this.buffer.slice(0, length);
    }

    logUsage(purpose: string): void {
        const category = purpose.split(' ')[0];
        const used = this.bytesEverUsed;
        const requested = this.bytesEverFetched;
        const efficiency = ((100.0 * used) / requested).toFixed(2);

        Logger.info(
            `${category} bytes used/requested: ${used} / ${requested} = ${efficiency}%`,
        );
    }
}

class HttpRangeClient {
    url: string;
    requestsEverMade = 0;
    bytesEverRequested = 0;

    constructor(url: string) {
        this.url = url;
    }

    async getRange(
        begin: number,
        length: number,
        purpose: string,
    ): Promise<ArrayBuffer> {
        this.requestsEverMade += 1;
        this.bytesEverRequested += length;

        const range = `bytes=${begin}-${begin + length - 1}`;
        Logger.info(
            `request: #${this.requestsEverMade}, purpose: ${purpose}), bytes: (this_request: ${length}, ever: ${this.bytesEverRequested}), Range: ${range}`,
        );

        const response = await fetch(this.url, {
            headers: {
                Range: range,
                // TODO: better parallelize requests on Chrome
                //
                // Safari and Firefox have no issue performing Range requests
                // for a resource in parallel, but Chrome will stall a
                // subsequent request to the resource until it's received the
                // response headers of the prior request. So, it still allows
                // some limited parallelization, but it's not ideal.
                //
                // This is seemingly an artifact of how Chrome manages caching
                // and it might differ between platforms. We could work around it
                // by setting the request header:
                //
                //      'Cache-Control': 'no-cache, no-store'
                //
                // This allows requests to be fully parallelized in Chrome, but
                // then Chrome won't cache the response, so it seems not a
                // great trade-off.
                //
                // Another work around would be to make each Range request for
                // a separate URL by appending something like
                // `?cache_buster=<range>` to the URL, but then Chrome will
                // require an additional CORS preflight OPTIONS requests per
                // Range, which is also not a great trade-off.
                //
                // See:
                // https://bugs.chromium.org/p/chromium/issues/detail?id=969828&q=concurrent%20range%20requests&can=2
                // https://stackoverflow.com/questions/27513994/chrome-stalls-when-making-multiple-requests-to-same-resource
            },
        });

        return response.arrayBuffer();
    }
}
