import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { HttpReader } from './http-reader';
import { fromFeature } from './geojson/feature';
import LocalWebServer from 'local-web-server';

describe('http reader', () => {
    let lws: LocalWebServer;
    beforeAll(async () => {
        lws = await LocalWebServer.create();
    });
    afterAll(() => {
        if (lws) lws.server.close();
    });

    it('fetches a subset of data based on bounding box', async () => {
        const testUrl = `http://localhost:${lws.config.port}/test/data/UScounties.fgb`;
        const rect = {
            minX: -106.88,
            minY: 36.75,
            maxX: -101.11,
            maxY: 41.24,
        };
        const reader = await HttpReader.open(testUrl);

        const features = [];
        for await (const feature of reader.selectBbox(rect)) {
            features.push(fromFeature(feature, reader.header));
        }
        expect(features.length).toBe(86);
        const actual = features
            .slice(0, 4)
            .map((f) => `${f.properties.NAME}, ${f.properties.STATE}`);
        const expected = [
            'Cheyenne, KS',
            'Rawlins, KS',
            'Yuma, CO',
            'Washington, CO',
        ];
        expect(actual).toEqual(expected);
    });

    it('can fetch the final feature', async () => {
        const testUrl = `http://localhost:${lws.config.port}/test/data/countries.fgb`;
        const rect = {
            minX: -61.2,
            minY: -51.85,
            maxX: -60.0,
            maxY: -51.25,
        };
        const reader = await HttpReader.open(testUrl);
        expect(179).toBe(reader.header.featuresCount);

        let featureCount = 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _feature of reader.selectBbox(rect)) {
            featureCount++;
        }
        expect(featureCount).toBe(2);
    });
});
