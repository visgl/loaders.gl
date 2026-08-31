// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
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

test('VectorSourceLayer exhausts option, viewport, and reuse update branches', async () => {
  const layer = createLayer({
    id: 'vector-branch-matrix',
    data: TEST_VECTOR_SOURCE as any,
    layers: 'auto',
    crs: 'EPSG:4326',
    format: 'arrow',
    debounceTime: 0
  });
  layer.initializeState();
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  const setOptions = vi.fn();
  const updateViewport = vi.fn(async () => {});
  const finalize = vi.fn();
  const unsubscribe = vi.fn();
  const vectorSet = {
    layers: [] as string[],
    data: null,
    isLoaded: false,
    setOptions,
    updateViewport,
    finalize
  };
  layer.state.resolvedData = TEST_VECTOR_SOURCE;
  layer.state.vectorSet = vectorSet;
  layer.state.unsubscribeVectorSetEvents = unsubscribe;
  layer.context = {viewport: createViewport([0, 1, 2, 3])};
  const stableProps = {
    ...layer.props,
    loaders: layer.props.loaders,
    sources: layer.props.sources,
    sourceOptions: layer.props.sourceOptions
  };

  layer.updateState({
    props: {...stableProps, layers: ['roads'], crs: 'EPSG:3857'},
    oldProps: stableProps,
    changeFlags: {dataChanged: false, viewportChanged: false}
  });
  expect(setOptions).toHaveBeenCalledOnce();
  expect(updateViewport).toHaveBeenCalledOnce();

  setOptions.mockClear();
  updateViewport.mockClear();
  layer.updateState({
    props: {...stableProps, debounceTime: 10},
    oldProps: stableProps,
    changeFlags: {dataChanged: false, viewportChanged: false}
  });
  expect(setOptions).toHaveBeenCalledOnce();
  expect(updateViewport).not.toHaveBeenCalled();

  layer.updateState({
    props: stableProps,
    oldProps: stableProps,
    changeFlags: {dataChanged: false, viewportChanged: true}
  });
  expect(updateViewport).not.toHaveBeenCalled();
  vectorSet.layers = ['metadata-layer'];
  layer.updateState({
    props: stableProps,
    oldProps: stableProps,
    changeFlags: {dataChanged: false, viewportChanged: true}
  });
  expect(updateViewport).toHaveBeenCalledOnce();
  await (layer as any)._updateViewport();
  expect(updateViewport).toHaveBeenCalledTimes(2);

  layer.context = {viewport: null};
  await (layer as any)._updateViewport();
  layer.context = {viewport: createViewport([0, 1, 2, 3])};
  layer.state.vectorSet = null;
  await (layer as any)._updateViewport();

  layer.state.vectorSet = vectorSet;
  expect((layer as any)._getOrCreateVectorSet(TEST_VECTOR_SOURCE, false)).toBe(vectorSet);
  (layer as any)._releaseVectorSet();
  expect(unsubscribe).toHaveBeenCalledOnce();
  expect(finalize).toHaveBeenCalledOnce();
  expect(layer.state.vectorSet).toBeNull();
});

test('VectorSourceLayer covers option defaults, direct source validation, and table render shapes', () => {
  const layer = createLayer({
    id: 'vector-options',
    data: TEST_VECTOR_SOURCE as any,
    layers: undefined as any,
    loaders: undefined as any,
    sources: undefined as any,
    sourceOptions: undefined as any
  });
  layer.initializeState();
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);

  expect(layer.shouldUpdateState()).toBe(true);
  expect(layer._resolveData(layer.props)).toBe(TEST_VECTOR_SOURCE);
  expect(() =>
    layer._resolveData({...layer.props, data: 'https://example.com/data'} as any)
  ).toThrow(/requires a SourceLoader/);
  expect(() => layer._resolveData({...layer.props, data: new Blob()} as any)).toThrow(
    /requires a SourceLoader/
  );
  expect(() => (layer as any)._getVectorSetOptions(layer.props)).toThrow(/has not been resolved/);

  layer.state.resolvedData = TEST_VECTOR_SOURCE;
  layer.state.vectorSet = {layers: ['auto-layer']};
  expect((layer as any)._getVectorSetOptions(layer.props)).toMatchObject({
    vectorSource: TEST_VECTOR_SOURCE,
    layers: ['auto-layer']
  });

  expect(layer.renderLayers()).toBeNull();
  layer.state.vectorSet.data = TABLE_A;
  expect((layer.renderLayers() as any).props.data).toEqual({
    type: 'FeatureCollection',
    features: TABLE_A.features
  });
  const binaryTable = {shape: 'binary-feature-collection', points: {positions: []}};
  layer.state.vectorSet.data = binaryTable;
  expect((layer.renderLayers() as any).props.data).toBe(binaryTable);
});

test('VectorSourceLayer metadata subscription covers automatic layer discovery and callbacks', async () => {
  const onMetadataLoad = vi.fn();
  const onDataLoad = vi.fn();
  const onError = vi.fn();
  const onLoadingStateChange = vi.fn();
  const layer = createLayer({
    id: 'vector-subscriptions',
    data: TEST_VECTOR_SOURCE as any,
    layers: 'auto',
    onMetadataLoad,
    onDataLoad,
    onError,
    onLoadingStateChange
  });
  layer.initializeState();
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  layer.setNeedsUpdate = vi.fn();
  layer.context = {viewport: createViewport([0, 1, 2, 3])};

  let subscriber: any;
  const vectorSet = {
    layers: [],
    setOptions: vi.fn(),
    updateViewport: vi.fn(async () => {}),
    finalize: vi.fn(),
    subscribe(callbacks: any) {
      subscriber = callbacks;
      return vi.fn();
    }
  };
  const fromVectorSource = vi
    .spyOn(VectorSet, 'fromVectorSource')
    .mockReturnValue(vectorSet as any);
  layer.state.resolvedData = TEST_VECTOR_SOURCE;
  expect((layer as any)._getOrCreateVectorSet(TEST_VECTOR_SOURCE, true)).toBe(vectorSet);
  subscriber.onLoadingStateChange(true);
  subscriber.onUpdate();
  subscriber.onDataLoad(TABLE_A);
  subscriber.onError(new Error('source error'));
  subscriber.onMetadataLoad({layers: [{name: 'roads'}]});
  await flushMicrotasks();

  expect(onLoadingStateChange).toHaveBeenCalledWith(true);
  expect(onDataLoad).toHaveBeenCalledWith(TABLE_A);
  expect(onError).toHaveBeenCalledWith(expect.any(Error));
  expect(onMetadataLoad).toHaveBeenCalledOnce();
  expect(vectorSet.setOptions).toHaveBeenCalledWith(expect.objectContaining({layers: 'roads'}));
  expect(vectorSet.updateViewport).toHaveBeenCalledOnce();
  fromVectorSource.mockRestore();
});

test('VectorSourceLayer reports incompatible sources and finalizes owned URL sources', async () => {
  const onSourceError = vi.fn();
  const incompatibleLayer = createLayer({
    id: 'incompatible-vector-source',
    data: {
      async getMetadata() {
        return {width: 1, height: 1, bandCount: 1, dtype: 'uint8'};
      },
      async getRaster() {
        return {data: new Uint8Array([1]), width: 1, height: 1, bandCount: 1, dtype: 'uint8'};
      }
    } as any,
    onSourceError
  });
  incompatibleLayer.initializeState();
  incompatibleLayer.raiseError = vi.fn();
  await incompatibleLayer.resolveVectorSource(incompatibleLayer.props);
  expect(onSourceError).toHaveBeenCalledOnce();
  expect(incompatibleLayer.raiseError).toHaveBeenCalledOnce();

  const close = vi.fn(async () => {});
  const source = {...TEST_VECTOR_SOURCE, close};
  const sourceLoader = {
    id: 'vector-source',
    name: 'Vector source',
    module: 'test',
    version: '1',
    extensions: ['vector'],
    mimeTypes: [],
    type: 'vector',
    fromUrl: true,
    fromBlob: false,
    testURL: () => true,
    createDataSource: () => source
  };
  const layer = createLayer({
    id: 'owned-vector-source',
    data: 'memory.vector',
    sources: [sourceLoader] as any,
    layers: []
  });
  layer.initializeState();
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  layer.context = {viewport: createViewport([0, 1, 2, 3])};
  layer.raiseError = vi.fn();
  await layer.resolveVectorSource(layer.props);
  layer.context = null;
  layer.finalizeState({} as any);
  await flushMicrotasks();
  expect(close).toHaveBeenCalledOnce();
});

test('VectorSourceLayer leaves auto layers idle when metadata has no named layer', async () => {
  const layer = createLayer({
    id: 'empty-auto-layers',
    data: TEST_VECTOR_SOURCE as any,
    layers: 'auto'
  });
  layer.initializeState();
  layer.setState = (update: Record<string, unknown>) => Object.assign(layer.state, update);
  let subscriber: any;
  const vectorSet = {
    layers: [],
    setOptions: vi.fn(),
    updateViewport: vi.fn(),
    subscribe(callbacks: any) {
      subscriber = callbacks;
      return vi.fn();
    },
    finalize: vi.fn()
  };
  const fromVectorSource = vi
    .spyOn(VectorSet, 'fromVectorSource')
    .mockReturnValue(vectorSet as any);
  layer.state.resolvedData = TEST_VECTOR_SOURCE;
  (layer as any)._getOrCreateVectorSet(TEST_VECTOR_SOURCE, true);
  subscriber.onMetadataLoad({layers: []});
  expect(vectorSet.updateViewport).not.toHaveBeenCalled();
  fromVectorSource.mockRestore();
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
