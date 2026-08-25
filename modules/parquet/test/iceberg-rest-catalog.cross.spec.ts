// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {RequestScheduler} from '@loaders.gl/loader-utils';
import {IcebergRestCatalog} from '../src/iceberg-rest-catalog';

test('IcebergRestCatalog loads a table through the standard REST endpoint', async () => {
  const metadataLocation = 'data:application/json,%7B%22format-version%22%3A2%2C%22location%22%3A%22table%22%7D';
  let requestedUrl = '';
  let requestedHeaders: HeadersInit | undefined;
  const catalog = new IcebergRestCatalog({
    endpoint: 'https://catalog.example.com/',
    headers: {Authorization: 'Bearer test'},
    fetch: async (url, options) => {
      if (url.startsWith('data:')) {
        return new Response(JSON.stringify({'format-version': 2, location: 'table'}), {status: 200});
      }
      requestedUrl = url;
      requestedHeaders = options?.headers;
      return new Response(JSON.stringify({'metadata-location': metadataLocation}), {status: 200});
    }
  });

  const table = await catalog.loadTable({namespace: ['analytics', 'sales'], table: 'orders'});

  expect(requestedUrl).toBe(
    'https://catalog.example.com/v1/namespaces/analytics%1Fsales/tables/orders'
  );
  expect(requestedHeaders).toEqual({Authorization: 'Bearer test'});
  expect(table.metadataLocation).toBe(metadataLocation);
  await expect(table.source.getMetadata()).resolves.toMatchObject({
    'format-version': 2,
    location: 'table'
  });
  await table.source.close();
});

test('IcebergRestCatalog accepts inline table metadata', async () => {
  const catalog = new IcebergRestCatalog({
    endpoint: 'https://catalog.example.com',
    fetch: async url =>
      new Response(
        url.startsWith('data:')
          ? JSON.stringify({'format-version': 2, location: 'https://data.example.com/table'})
          : JSON.stringify({
              metadata: {'format-version': 2, location: 'https://data.example.com/table'}
            })
      )
  });

  const table = await catalog.loadTable({namespace: ['demo'], table: 'events'});

  expect(table.metadata).toMatchObject({location: 'https://data.example.com/table'});
  await expect(table.source.getMetadata()).resolves.toMatchObject({
    location: 'https://data.example.com/table'
  });
  await table.source.close();
});

test('IcebergRestCatalog can share the loader-utils request scheduler', async () => {
  const requestScheduler = new RequestScheduler({maxRequests: 1});
  let activeRequests = 0;
  let maximumActiveRequests = 0;
  const catalog = new IcebergRestCatalog({
    endpoint: 'https://catalog.example.com',
    requestScheduler,
    fetch: async () => {
      activeRequests++;
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
      await new Promise(resolve => setTimeout(resolve, 1));
      activeRequests--;
      return new Response(JSON.stringify({metadata: {'format-version': 2, location: 'table'}}));
    }
  });

  await Promise.all([
    catalog.loadTable({namespace: ['demo'], table: 'one'}),
    catalog.loadTable({namespace: ['demo'], table: 'two'})
  ]);

  expect(maximumActiveRequests).toBe(1);
});
