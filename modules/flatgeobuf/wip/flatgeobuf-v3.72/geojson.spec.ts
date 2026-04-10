import { describe, it, expect } from 'vitest';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter.js';
import WKTReader from 'jsts/org/locationtech/jts/io/WKTReader.js';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';
import { arrayToStream, takeAsync } from './streams/utils.js';
import { deserialize, serialize } from './geojson.js';
import { IGeoJsonFeature } from './geojson/feature.js';
import { Rect } from './packedrtree.js';
import HeaderMeta from './header-meta.js';

global.fetch = fetch as any;

import {
    FeatureCollection as GeoJsonFeatureCollection,
    Point,
    MultiPoint,
    LineString,
    MultiLineString,
    Polygon,
    MultiPolygon,
} from 'geojson';

function makeFeatureCollection(wkt: string, properties?: any) {
    return makeFeatureCollectionFromArray([wkt], properties);
}

function makeFeatureCollectionFromArray(wkts: string[], properties?: any) {
    const reader: any = new WKTReader(undefined);
    const writer: any = new GeoJSONWriter();
    const geometries = wkts.map((wkt) => writer.write(reader.read(wkt)));
    const features = geometries.map(
        (geometry) =>
            ({ type: 'Feature', geometry, properties: {} }) as IGeoJsonFeature,
    );
    if (properties) features.forEach((f) => (f.properties = properties));
    return {
        type: 'FeatureCollection',
        features,
    } as GeoJsonFeatureCollection;
}

describe('geojson module', () => {
    describe('Geometry roundtrips', () => {
        it('Point', () => {
            const expected = makeFeatureCollection('POINT(1.2 -2.1)');
            const s = serialize(expected);
            const actual = deserialize(s);
            expect(actual).to.deep.equal(expected);
        });

        it('Point 3D', () => {
            const expected = makeFeatureCollection('POINT Z(1.2 -2.1 10)');
            const s = serialize(expected);
            const actual = deserialize(s);
            expect(actual).to.deep.equal(expected);
        });

        it('Point via stream', async () => {
            const expected = makeFeatureCollection('POINT(1.2 -2.1)');
            const s = serialize(expected);
            const stream = arrayToStream(s);
            const actual = await takeAsync(
                deserialize(stream) as AsyncGenerator,
            );
            expect(actual).to.deep.equal(expected.features);
        });

        it('Points', () => {
            const expected = makeFeatureCollectionFromArray([
                'POINT(1.2 -2.1)',
                'POINT(2.4 -4.8)',
            ]);
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('MultiPoint', () => {
            const expected = makeFeatureCollection(
                'MULTIPOINT(10 40, 40 30, 20 20, 30 10)',
            );
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('LineString', () => {
            const expected = makeFeatureCollection(
                'LINESTRING(1.2 -2.1, 2.4 -4.8)',
            );
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('LineString 3D', () => {
            const expected = makeFeatureCollection(
                'LINESTRING Z(1.2 -2.1 1.1, 2.4 -4.8 1.2)',
            );
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('MultiLineString', () => {
            const expected =
                makeFeatureCollection(`MULTILINESTRING((10 10, 20 20, 10 40),
 (40 40, 30 30, 40 20, 30 10), (50 50, 60 60, 50 90))`);
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('MultiLineStringSinglePart', () => {
            const expected = makeFeatureCollection(
                `MULTILINESTRING((1.2 -2.1, 2.4 -4.8))`,
            );
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('Polygon', () => {
            const expected = makeFeatureCollection(
                `POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))`,
            );
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('Polygon via stream', async () => {
            const expected = makeFeatureCollection(
                `POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))`,
            );
            const s = serialize(expected);
            const stream = arrayToStream(s);
            const actual = await takeAsync(
                deserialize(
                    stream as unknown as ReadableStream<any>,
                ) as AsyncGenerator,
            );
            expect(actual).to.deep.equal(expected.features);
        });

        it('PolygonWithHole', () => {
            const expected =
                makeFeatureCollection(`POLYGON ((35 10, 45 45, 15 40, 10 20, 35 10),
 (20 30, 35 35, 30 20, 20 30))`);
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('PolygonWithHole 3D', () => {
            const expected =
                makeFeatureCollection(`POLYGON Z((35 10 3, 45 45 4, 15 40 5, 10 20 6, 35 10 7),
 (20 30 3, 35 35 4, 30 20 5, 20 30 6))`);
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('MultiPolygon', () => {
            const expected =
                makeFeatureCollection(`MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)),
 ((15 5, 40 10, 10 20, 5 10, 15 5)))`);
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('MultiPolygonWithHole', () => {
            const expected =
                makeFeatureCollection(`MULTIPOLYGON (((40 40, 20 45, 45 30, 40 40)),
 ((20 35, 10 30, 10 10, 30 5, 45 20, 20 35), (30 20, 20 15, 20 25, 30 20)))`);
            const actual = deserialize(serialize(expected));
            // NOTE: 28 flat coords, ends = [4, 10, 14], endss = [1, 2]
            expect(actual).to.deep.equal(expected);
        });

        it('MultiPolygonSinglePart', () => {
            const expected = makeFeatureCollection(
                `MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)))`,
            );
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('MultiPolygonSinglePartWithHole', () => {
            const expected =
                makeFeatureCollection(`MULTIPOLYGON (((35 10, 45 45, 15 40, 10 20, 35 10),
 (20 30, 35 35, 30 20, 20 30))))`);
            const actual = deserialize(serialize(expected));
            // NOTE: 18 flat coords, ends = [5, 9], endss = null
            expect(actual).to.deep.equal(expected);
        });

        it('GeometryCollection', () => {
            const expected = makeFeatureCollection(
                `GEOMETRYCOLLECTION(POINT(4 6),LINESTRING(4 6,7 10))`,
            );
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('GeometryCollection 3D', () => {
            const expected = makeFeatureCollection(
                `GEOMETRYCOLLECTION Z(POINT Z(4 6 3),LINESTRING Z(4 6 4,7 10 5))`,
            );
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('Bahamas', () => {
            const expected = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: { name: 'The Bahamas' },
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [-77.53466, 23.75975],
                                        [-77.78, 23.71],
                                        [-78.03405, 24.28615],
                                        [-78.40848, 24.57564],
                                        [-78.19087, 25.2103],
                                        [-77.89, 25.17],
                                        [-77.54, 24.34],
                                        [-77.53466, 23.75975],
                                    ],
                                ],
                                [
                                    [
                                        [-77.82, 26.58],
                                        [-78.91, 26.42],
                                        [-78.98, 26.79],
                                        [-78.51, 26.87],
                                        [-77.85, 26.84],
                                        [-77.82, 26.58],
                                    ],
                                ],
                                [
                                    [
                                        [-77, 26.59],
                                        [-77.17255, 25.87918],
                                        [-77.35641, 26.00735],
                                        [-77.34, 26.53],
                                        [-77.78802, 26.92516],
                                        [-77.79, 27.04],
                                        [-77, 26.59],
                                    ],
                                ],
                            ],
                        },
                    },
                ],
            };
            const actual = deserialize(serialize(expected as any));
            expect(actual).to.deep.equal(expected);
        });

        it('Heterogeneous geometries', () => {
            const expected = makeFeatureCollectionFromArray([
                'POINT(1.2 -2.1)',
                'LINESTRING(1.2 -2.1, 2.4 -4.8)',
                'MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)))',
            ]);
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('Long feature properties', () => {
            const expected = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {
                            veryLong1: Array(1024 * 10)
                                .fill('X')
                                .join(''),
                            veryLong2: Array(1024 * 10)
                                .fill('Y')
                                .join(''),
                            veryLong3: Array(1024 * 10)
                                .fill('Z')
                                .join(''),
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: [-77.53466, 23.75975],
                        },
                    },
                ],
            };
            const actual = deserialize(serialize(expected as any));
            expect(actual).to.deep.equal(expected);
        });
    });

    describe('Attribute roundtrips', () => {
        it('Number', () => {
            const expected = makeFeatureCollection('POINT(1 1)', {
                test: 1,
            });
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('Number with decimals', () => {
            const expected = makeFeatureCollection('POINT(1 1)', {
                test: 1.1,
            });
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('NumberTwoAttribs', () => {
            const expected = makeFeatureCollection('POINT(1 1)', {
                test1: 1,
                test2: 1,
            });
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('NumberWithDecimal', () => {
            const expected = makeFeatureCollection('POINT(1 1)', {
                test: 1.1,
            });
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('Boolean', () => {
            const expected = makeFeatureCollection('POINT(1 1)', {
                test: true,
            });
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('String', () => {
            const expected = makeFeatureCollection('POINT(1 1)', {
                test: 'test',
            });
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('Mixed', () => {
            const expected = makeFeatureCollection('POINT(1 1)', {
                test1: 1,
                test2: 1.1,
                test3: 'test',
                test4: true,
            });
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });

        it('Json Value', () => {
            const expected = makeFeatureCollection('POINT(1 1)', {
                test: { hello: 'world' },
            });
            const actual = deserialize(serialize(expected));
            expect(actual).to.deep.equal(expected);
        });
    });

    describe('Prepared buffers tests', () => {
        it('Should parse countries fgb produced from GDAL byte array', () => {
            const buffer = readFileSync('./test/data/countries.fgb');
            const bytes = new Uint8Array(buffer);
            let headerMeta: HeaderMeta;
            const geojson = deserialize(
                bytes,
                undefined,
                (header: HeaderMeta) => (headerMeta = header),
            ) as GeoJsonFeatureCollection;
            expect(headerMeta.crs.code).to.eq(4326);
            expect(geojson.features.length).to.eq(179);
            for (const f of geojson.features) {
                const g = f.geometry as
                    | Point
                    | MultiPoint
                    | LineString
                    | MultiLineString
                    | Polygon
                    | MultiPolygon;
                expect((g.coordinates[0] as number[]).length).to.be.greaterThan(
                    0,
                );
            }
        });

        it('Should parse countries fgb produced from GDAL stream filter', async () => {
            const r: Rect = { minX: 12, minY: 56, maxX: 12, maxY: 56 };
            const features = await takeAsync(
                deserialize(
                    'http://flatgeobuf.septima.dk/countries.fgb',
                    r,
                ) as AsyncGenerator,
            );
            expect(features.length).to.eq(3);
            for (const f of features)
                expect(
                    (f.geometry.coordinates[0] as number[]).length,
                ).to.be.greaterThan(0);
        });

        it('Should parse countries fgb produced from GDAL stream no filter', async () => {
            const buffer = readFileSync('./test/data/countries.fgb');
            const bytes = new Uint8Array(buffer);
            const stream = arrayToStream(bytes.buffer);
            const features = await takeAsync(
                deserialize(
                    stream as unknown as ReadableStream<any>,
                ) as AsyncGenerator,
            );
            expect(features.length).to.eq(179);
            for (const f of features)
                expect(
                    (f.geometry.coordinates[0] as number[]).length,
                ).to.be.greaterThan(0);
        });

        it('Should parse UScounties fgb produced from GDAL', () => {
            const buffer = readFileSync('./test/data/UScounties.fgb');
            const bytes = new Uint8Array(buffer);
            const geojson = deserialize(bytes) as GeoJsonFeatureCollection;
            expect(geojson.features.length).to.eq(3221);
            for (const f of geojson.features) {
                const g = f.geometry as
                    | Point
                    | MultiPoint
                    | LineString
                    | MultiLineString
                    | Polygon
                    | MultiPolygon;
                expect((g.coordinates[0] as number[]).length).to.be.greaterThan(
                    0,
                );
            }
        });

        it('Should parse heterogeneous fgb produced from Rust impl', () => {
            const buffer = readFileSync('./test/data/heterogeneous.fgb');
            const bytes = new Uint8Array(buffer);
            const geojson = deserialize(bytes) as GeoJsonFeatureCollection;
            const expected = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: { type: 'Point', coordinates: [1.2, -2.1] },
                    },
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [1.2, -2.1],
                                [2.4, -4.8],
                            ],
                        },
                    },
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [30, 20],
                                        [45, 40],
                                        [10, 40],
                                        [30, 20],
                                    ],
                                ],
                            ],
                        },
                    },
                ],
            };
            expect(geojson).to.deep.equal(expected);
        });
    });
});
