import { expect, test } from "vitest";
// @ts-ignore
import { isInterleaved, getIndexer } from '@loaders.gl/zarr/lib/utils';
test('isInterleaved', () => {
    expect.assertions(4);
    expect(isInterleaved([1, 2, 400, 400, 4])).toBeTruthy();
    expect(isInterleaved([1, 2, 400, 400, 3])).toBeTruthy();
    expect(!isInterleaved([1, 2, 400, 400])).toBeTruthy();
    expect(!isInterleaved([1, 3, 4, 4000000])).toBeTruthy();
});
test('Indexer creation and usage.', () => {
    expect.assertions(4);
    const labels = ['a', 'b', 'y', 'x'];
    const indexer = getIndexer(labels);
    expect(indexer({ a: 10, b: 20 }), 'should allow named indexing.').toEqual([10, 20, 0, 0]);
    expect(indexer([10, 20, 0, 0]), 'allows array like indexing.').toEqual([10, 20, 0, 0]);
    expect(() => indexer({ c: 0, b: 0 }), 'should throw with invalid dim name.').toThrow();
    expect(() => getIndexer(['a', 'b', 'c', 'b', 'y', 'x']), 'no duplicated labels names.').toThrow();
});
