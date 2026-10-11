// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh} from '@loaders.gl/schema';
import type {PotreeDataset} from '../src/potree-writer';

/** Small decoded native-coordinate point fixture. */
export function createPoints(positions = [0, 0, 0, 8, 8, 8]): Mesh {
  return {
    topology: 'point-list',
    mode: 0,
    schema: {fields: [], metadata: {}},
    attributes: {
      POSITION: {value: new Float64Array(positions), size: 3},
      COLOR_0: {
        value: new Uint8Array((positions.length / 3) * 3).fill(17),
        size: 3,
        normalized: true
      }
    }
  };
}

/** In-memory HTTP transport that enforces exact range requests; never accesses the network. */
export function createDatasetFetch(dataset: PotreeDataset) {
  const requests: {url: string; range: string | null}[] = [];
  const fetch = async (input: string | Request | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    const path = new URL(url).pathname.replace(/^\/dataset\//, '');
    const bytes = dataset.files.get(path);
    const range = new Headers(init?.headers).get('range');
    requests.push({url, range});
    if (!bytes) return new Response(null, {status: 404});
    if (!range) return new Response(bytes.slice());
    const match = /^bytes=(\d+)-(\d+)$/.exec(range)!;
    const start = Number(match[1]);
    const end = Number(match[2]);
    return new Response(bytes.slice(start, end + 1), {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${bytes.length}`
      }
    });
  };
  return {fetch, requests};
}
