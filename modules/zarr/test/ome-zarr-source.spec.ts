// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OMEZarrImageSource} from '@loaders.gl/zarr';
import {expect, test} from 'vitest';

test('OMEZarrImageSource selects channels from an interleaved _c array', async () => {
  const baseUrl = 'https://example.com/interleaved.zarr';
  const source = new OMEZarrImageSource(baseUrl, {
    core: {loadOptions: {core: {fetch: createInterleavedOMEFetcher(baseUrl)}}},
    zarr: {requireConsolidatedMetadata: false},
    omezarr: {defaultChannels: [2, 0]}
  });

  expect(source.getRasterQueryCapabilities()).toBeDefined();
  const metadata = await source.getMetadata();
  expect(metadata.labels).toEqual(['y', 'x', '_c']);
  expect(metadata.bandCount).toBe(3);

  const planar = await source.getRaster({interleaved: false});
  expect(Array.isArray(planar.data)).toBe(true);
  expect(Array.from(planar.data[0])).toEqual([3, 6, 9, 12]);
  expect(Array.from(planar.data[1])).toEqual([1, 4, 7, 10]);

  const selectedInterleaved = await source.getRaster({channels: [1, 2], interleaved: true});
  expect(Array.from(selectedInterleaved.data as Uint8Array)).toEqual([2, 3, 5, 6, 8, 9, 11, 12]);
  const completeInterleaved = await source.getRaster({channels: [0, 1, 2], interleaved: true});
  expect(Array.from(completeInterleaved.data as Uint8Array)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ]);
  const singleChannel = await source.getRaster({channels: [1], interleaved: false});
  expect(Array.from(singleChannel.data as Uint8Array)).toEqual([2, 5, 8, 11]);
});

/** Creates a tiny in-memory OME-Zarr v3 image with pixel-interleaved channels. */
function createInterleavedOMEFetcher(baseUrl: string): typeof fetch {
  const groupMetadata = {
    zarr_format: 3,
    node_type: 'group',
    attributes: {
      multiscales: [
        {name: 'interleaved', axes: ['y', 'x', '_c'], datasets: [{path: '0'}]}
      ],
      omero: {
        name: 'interleaved',
        channels: [{label: 'red'}, {label: 'green'}, {label: 'blue'}]
      }
    }
  };
  const arrayMetadata = {
    zarr_format: 3,
    node_type: 'array',
    shape: [2, 2, 3],
    data_type: 'uint8',
    chunk_grid: {name: 'regular', configuration: {chunk_shape: [2, 2, 3]}},
    chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
    codecs: [{name: 'bytes', configuration: {endian: 'little'}}],
    fill_value: 0,
    dimension_names: ['y', 'x', '_c'],
    attributes: {}
  };
  const responses = new Map<string, BodyInit>([
    [`${baseUrl}/zarr.json`, new TextEncoder().encode(JSON.stringify(groupMetadata))],
    [`${baseUrl}/0/zarr.json`, new TextEncoder().encode(JSON.stringify(arrayMetadata))],
    [
      `${baseUrl}/0/c/0/0/0`,
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    ]
  ]);

  return (async input => {
    const url = input instanceof Request ? input.url : String(input);
    const body = responses.get(url);
    return body === undefined ? new Response(null, {status: 404}) : new Response(body);
  }) as typeof fetch;
}
