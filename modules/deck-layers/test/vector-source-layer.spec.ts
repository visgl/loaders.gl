// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertGeometryToWKB} from '@loaders.gl/gis';
import {VectorSourceLayer, type VectorSourceLayerProps} from '@loaders.gl/deck-layers';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
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
const ARROW_TABLE = createArrowTable();
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
test('VectorSet#keeps only the latest viewport request and skips identical requests', async () => {
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
  expect(requestedParameters.length, 'issued one request per changed viewport').toBe(2);
  expect(vectorSet.data, 'keeps the latest resolved table').toBe(TABLE_B);
  await vectorSet.updateViewport(secondViewport as any);
  expect(requestedParameters.length, 'does not refetch identical viewport parameters').toBe(2);
});
test('VectorSet#emits loading state changes', async () => {
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
  expect(loadingStates).toEqual([true, false]);
});
test('VectorSet#finishes superseded viewport loads', async () => {
  const loadingStates: boolean[] = [];
  const firstRequest = createDeferredPromise<any>();
  const secondRequest = createDeferredPromise<any>();
  let requestCount = 0;
  const vectorSet = new VectorSet({
    vectorSource: {
      async getMetadata() {
        return {name: 'roads', keywords: [], layers: []};
      },
      async getSchema() {
        return {metadata: {}, fields: []};
      },
      async getFeatures() {
        requestCount++;
        return requestCount === 1 ? firstRequest.promise : secondRequest.promise;
      }
    } as any,
    layers: ['roads'],
    crs: 'EPSG:4326',
    debounceTime: 0
  });
  vectorSet.subscribe({
    onLoadingStateChange: isLoading => loadingStates.push(isLoading)
  });
  const firstPromise = vectorSet.updateViewport(createViewport([0, 1, 2, 3]) as any);
  const secondPromise = vectorSet.updateViewport(createViewport([10, 11, 12, 13]) as any);
  secondRequest.resolvePromise(TABLE_B as any);
  await secondPromise;
  firstRequest.resolvePromise(TABLE_A as any);
  await firstPromise;
  expect(loadingStates, 'clears loading after stale and current requests settle').toEqual([
    true,
    false
  ]);
  expect(vectorSet.isLoading, 'does not leave isLoading stuck after superseded requests').toBe(
    false
  );
});
test('VectorSet#debounces viewport requests', async () => {
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
  expect(requestedParameters.length, 'only issues the last debounced viewport request').toBe(1);
  expect(requestedParameters[0].boundingBox).toEqual([
    [10, 11],
    [12, 13]
  ]);
});
test('VectorSet#resolves canceled debounced viewport updates', async () => {
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
  expect(requestedParameters.length, 'only the latest debounced request reaches the source').toBe(
    1
  );
  expect(requestedParameters[0].boundingBox).toEqual([
    [10, 11],
    [12, 13]
  ]);
});
test('VectorSourceLayer#fetches for initial and changed viewports and renders GeoJsonLayer', async () => {
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
    format: 'geojson',
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
  expect(requestedParameters.length, 'requests the initial viewport').toBe(1);
  expect(loadedTables.length, 'forwards successful table loads').toBe(1);
  layer.context = {viewport: createViewport([10, 11, 12, 13])};
  layer.updateState({
    props: layer.props,
    oldProps: layer.props,
    changeFlags: {dataChanged: false, viewportChanged: true}
  });
  await flushMicrotasks();
  expect(requestedParameters.length, 'requests changed viewports').toBe(2);
  const renderedLayer = layer.renderLayers();
  expect(renderedLayer.constructor.layerName, 'renders the default GeoJsonLayer').toBe(
    'GeoJsonLayer'
  );
  expect(renderedLayer.props.pickable, 'forwards GeoJsonLayer props').toBe(true);
  expect(renderedLayer.props.data, 'passes GeoJsonLayer a plain FeatureCollection').toEqual({
    type: 'FeatureCollection',
    features: [{type: 'Feature', geometry: null, properties: {requestCount: 2}}]
  });
});
test('VectorSourceLayer#forwards request errors', async () => {
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
  expect(errors.length, 'forwards fetch errors').toBe(1);
  expect(errors[0]?.message).toBe('request failed');
});
test('VectorSet accepts Arrow tables and VectorSourceLayer renders GeoJsonLayer binary data', async () => {
  const vectorSet = new VectorSet({
    vectorSource: {
      async getMetadata() {
        return {name: 'roads', keywords: [], layers: []};
      },
      async getSchema() {
        return {metadata: {}, fields: []};
      },
      async getFeatures() {
        return ARROW_TABLE as any;
      }
    } as any,
    layers: ['roads'],
    crs: 'EPSG:4326',
    format: 'arrow',
    debounceTime: 0
  });
  await vectorSet.updateViewport(createViewport([0, 1, 2, 3]) as any);
  expect(vectorSet.data, 'VectorSet keeps Arrow tables').toBe(ARROW_TABLE);
  const layer = createLayer({
    id: 'vector-layer-arrow',
    data: {
      async getMetadata() {
        return {name: 'roads', keywords: [], layers: [{name: 'roads'}]};
      },
      async getSchema() {
        return ARROW_TABLE.schema;
      },
      async getFeatures() {
        return ARROW_TABLE as any;
      }
    } as any,
    layers: ['roads'],
    format: 'arrow',
    debounceTime: 0,
    geoArrowLayerProps: {
      pointLayerProps: {
        getFillColor: [1, 2, 3, 4]
      }
    }
  });
  layer.initializeState();
  layer.context = {viewport: createViewport([0, 1, 2, 3])};
  layer.updateState({
    props: layer.props,
    oldProps: {...layer.props, data: null},
    changeFlags: {dataChanged: true, viewportChanged: true}
  });
  await flushMicrotasks();
  const renderedLayer = layer.renderLayers();
  expect(renderedLayer.constructor.layerName, 'renders Arrow data through GeoJsonLayer').toBe(
    'GeoJsonLayer'
  );
  expect(renderedLayer.props.data.shape, 'passes deck.gl binary feature data to GeoJsonLayer').toBe(
    'binary-feature-collection'
  );
  expect(
    renderedLayer.props.getFillColor,
    'maps GeoArrowLayer point styling props to GeoJsonLayer props'
  ).toEqual([1, 2, 3, 4]);
});
function createArrowTable() {
  const schema = {
    fields: [
      {name: 'name', type: 'utf8', nullable: true, metadata: {}},
      {
        name: 'geometry',
        type: 'binary',
        nullable: true,
        metadata: {'ARROW:extension:name': 'geoarrow.wkb'}
      }
    ],
    metadata: {
      geo: JSON.stringify({
        version: '1.1.0',
        primary_column: 'geometry',
        columns: {geometry: {encoding: 'wkb', geometry_types: ['Point']}}
      })
    }
  };
  const builder = new ArrowTableBuilder(schema);
  builder.addObjectRow({
    name: 'arrow',
    geometry: new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]}))
  });
  return builder.finishTable();
}
