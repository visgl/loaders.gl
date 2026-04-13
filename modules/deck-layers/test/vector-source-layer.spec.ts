// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {VectorSourceLayer, type VectorSourceLayerProps} from '@loaders.gl/deck-layers';
import {VectorSet} from '../src/vector-source-layer/vector-set';

function createDeferredPromise<T>() {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (error?: Error) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return {promise, resolvePromise, rejectPromise};
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

const TABLE_A = {
  shape: 'geojson-table',
  type: 'FeatureCollection',
  features: [{type: 'Feature', geometry: null, properties: {name: 'a'}}]
} as const;

const TABLE_B = {
  shape: 'geojson-table',
  type: 'FeatureCollection',
  features: [{type: 'Feature', geometry: null, properties: {name: 'b'}}]
} as const;

const TEST_VECTOR_SOURCE = {
  async getMetadata() {
    return {name: 'test', keywords: [], layers: []};
  },
  async getSchema() {
    return {metadata: {}, fields: []};
  },
  async getFeatures() {
    return TABLE_A as any;
  }
};

function createLayer(
  props: VectorSourceLayerProps = {
    id: 'test',
    data: TEST_VECTOR_SOURCE as any,
    layers: ['roads'],
    debounceTime: 0
  }
) {
  return new VectorSourceLayer(props as any) as any;
}

function createViewport(bounds: [number, number, number, number]) {
  return {
    getBounds: () => bounds
  };
}

test('VectorSet#keeps only the latest viewport request and skips identical requests', async t => {
  const firstRequest = createDeferredPromise<any>();
  const secondRequest = createDeferredPromise<any>();
  const requestedParameters: any[] = [];
  const vectorSource = {
    async getMetadata() {
      return {name: 'roads', keywords: [], layers: []};
    },
    async getSchema() {
      return {metadata: {}, fields: []};
    },
    async getFeatures(parameters: any) {
      requestedParameters.push(parameters);
      return requestedParameters.length === 1 ? firstRequest.promise : secondRequest.promise;
    }
  };

  const vectorSet = new VectorSet({
    vectorSource: vectorSource as any,
    layers: ['roads'],
    crs: 'EPSG:4326',
    debounceTime: 0
  });

  const firstViewport = createViewport([0, 1, 2, 3]);
  const secondViewport = createViewport([10, 11, 12, 13]);

  const firstPromise = vectorSet.updateViewport(firstViewport as any);
  const secondPromise = vectorSet.updateViewport(secondViewport as any);

  secondRequest.resolvePromise(TABLE_B as any);
  await secondPromise;
  firstRequest.resolvePromise(TABLE_A as any);
  await firstPromise;

  t.equal(requestedParameters.length, 2, 'issued one request per changed viewport');
  t.equal(vectorSet.data, TABLE_B, 'keeps the latest resolved table');

  await vectorSet.updateViewport(secondViewport as any);
  t.equal(requestedParameters.length, 2, 'does not refetch identical viewport parameters');
  t.end();
});

test('VectorSet#emits loading state changes', async t => {
  const loadingStates: boolean[] = [];
  let resolveRequest;
  const vectorSet = new VectorSet({
    vectorSource: {
      async getMetadata() {
        return {name: 'roads', keywords: [], layers: []};
      },
      async getSchema() {
        return {metadata: {}, fields: []};
      },
      getFeatures() {
        return new Promise(resolve => {
          resolveRequest = () => resolve(TABLE_A as any);
        }) as Promise<any>;
      }
    } as any,
    layers: ['roads'],
    crs: 'EPSG:4326',
    debounceTime: 0
  });

  vectorSet.subscribe({
    onLoadingStateChange: isLoading => loadingStates.push(isLoading)
  });

  vectorSet.updateViewport(createViewport([0, 1, 2, 3]) as any);
  await flushMicrotasks();
  resolveRequest?.();
  await flushMicrotasks();

  t.deepEqual(loadingStates, [true, false]);
  t.end();
});

test('VectorSet#debounces viewport requests', async t => {
  const requestedParameters: any[] = [];
  const vectorSet = new VectorSet({
    vectorSource: {
      async getMetadata() {
        return {name: 'roads', keywords: [], layers: []};
      },
      async getSchema() {
        return {metadata: {}, fields: []};
      },
      async getFeatures(parameters: any) {
        requestedParameters.push(parameters);
        return TABLE_A as any;
      }
    } as any,
    layers: ['roads'],
    crs: 'EPSG:4326',
    debounceTime: 5
  });

  vectorSet.updateViewport(createViewport([0, 1, 2, 3]) as any);
  vectorSet.updateViewport(createViewport([10, 11, 12, 13]) as any);
  await new Promise(resolve => setTimeout(resolve, 20));

  t.equal(requestedParameters.length, 1, 'only issues the last debounced viewport request');
  t.deepEqual(requestedParameters[0].boundingBox, [
    [10, 11],
    [12, 13]
  ]);
  t.end();
});

test('VectorSet#resolves canceled debounced viewport updates', async t => {
  const requestedParameters: any[] = [];
  const vectorSet = new VectorSet({
    vectorSource: {
      async getMetadata() {
        return {name: 'roads', keywords: [], layers: []};
      },
      async getSchema() {
        return {metadata: {}, fields: []};
      },
      async getFeatures(parameters: any) {
        requestedParameters.push(parameters);
        return TABLE_A as any;
      }
    } as any,
    layers: ['roads'],
    crs: 'EPSG:4326',
    debounceTime: 20
  });

  const firstPromise = vectorSet.updateViewport(createViewport([0, 1, 2, 3]) as any);
  const secondPromise = vectorSet.updateViewport(createViewport([10, 11, 12, 13]) as any);

  await Promise.race([
    Promise.all([firstPromise, secondPromise]),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), 100))
  ]);

  t.equal(requestedParameters.length, 1, 'only the latest debounced request reaches the source');
  t.deepEqual(requestedParameters[0].boundingBox, [
    [10, 11],
    [12, 13]
  ]);
  t.end();
});

test('VectorSourceLayer#fetches for initial and changed viewports and renders GeoJsonLayer', async t => {
  const requestedParameters: any[] = [];
  const loadedTables: any[] = [];
  const source = {
    async getMetadata() {
      return {name: 'roads', keywords: [], layers: [{name: 'roads'}]};
    },
    async getSchema() {
      return {metadata: {}, fields: []};
    },
    async getFeatures(parameters: any) {
      requestedParameters.push(parameters);
      return {
        shape: 'geojson-table',
        type: 'FeatureCollection',
        features: [
          {type: 'Feature', geometry: null, properties: {requestCount: requestedParameters.length}}
        ]
      };
    }
  };

  const layer = createLayer({
    id: 'vector-layer',
    data: source as any,
    layers: ['roads'],
    debounceTime: 0,
    onDataLoad: table => loadedTables.push(table),
    geoJsonLayerProps: {pickable: true}
  });

  layer.initializeState();
  layer.context = {viewport: createViewport([0, 1, 2, 3])};

  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true, viewportChanged: true}
  });
  await flushMicrotasks();

  t.equal(requestedParameters.length, 1, 'requests the initial viewport');
  t.equal(loadedTables.length, 1, 'forwards successful table loads');

  layer.context = {viewport: createViewport([10, 11, 12, 13])};
  layer.updateState({
    props: layer.props,
    oldProps: layer.props,
    changeFlags: {dataChanged: false, viewportChanged: true}
  });
  await flushMicrotasks();

  t.equal(requestedParameters.length, 2, 'requests changed viewports');

  const renderedLayer = layer.renderLayers();
  t.equal(renderedLayer.constructor.layerName, 'GeoJsonLayer', 'renders the default GeoJsonLayer');
  t.equal(renderedLayer.props.pickable, true, 'forwards GeoJsonLayer props');
  t.deepEqual(
    renderedLayer.props.data,
    {
      type: 'FeatureCollection',
      features: [{type: 'Feature', geometry: null, properties: {requestCount: 2}}]
    },
    'passes GeoJsonLayer a plain FeatureCollection'
  );
  t.end();
});

test('VectorSourceLayer#forwards request errors', async t => {
  const errors: Error[] = [];
  const source = {
    async getMetadata() {
      return {name: 'roads', keywords: [], layers: []};
    },
    async getSchema() {
      return {metadata: {}, fields: []};
    },
    async getFeatures() {
      throw new Error('request failed');
    }
  };

  const layer = createLayer({
    id: 'vector-layer',
    data: source as any,
    layers: ['roads'],
    debounceTime: 0,
    onError: error => errors.push(error)
  });

  layer.initializeState();
  layer.context = {viewport: createViewport([0, 1, 2, 3])};
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true, viewportChanged: true}
  });
  await flushMicrotasks();

  t.equal(errors.length, 1, 'forwards fetch errors');
  t.equal(errors[0]?.message, 'request failed');
  t.end();
});
