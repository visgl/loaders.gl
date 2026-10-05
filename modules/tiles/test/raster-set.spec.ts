import {expect, test} from 'vitest';
import {RasterSet} from '@loaders.gl/tiles';
function createRasterSource() {
  return {
    async getMetadata() {
      return {
        name: 'test',
        width: 4,
        height: 2,
        bandCount: 1,
        dtype: 'uint16' as const
      };
    },
    async getRaster(parameters: any) {
      return {
        data: new Uint16Array(parameters.viewport.width * parameters.viewport.height),
        width: parameters.viewport.width,
        height: parameters.viewport.height,
        bandCount: 1,
        dtype: 'uint16'
      };
    }
  };
}
function createViewport(width = 2, height = 1) {
  return {
    id: `${width}x${height}`,
    width,
    height,
    zoom: 0,
    center: [0, 0],
    bounds: [
      [0, 0],
      [1, 1]
    ] as [[number, number], [number, number]],
    project: (coordinates: number[]) => coordinates,
    unprojectPosition: (position: number[]) => [position[0], position[1], position[2] || 0]
  };
}
test('RasterSet#loads metadata from RasterSource', async () => {
  const rasterSet = RasterSet.fromRasterSource(createRasterSource() as any);
  const metadata = await rasterSet.loadMetadata();
  expect(metadata.name).toBe('test');
  expect(metadata.dtype).toBe('uint16');
  expect(rasterSet.metadata?.bandCount).toBe(1);
  rasterSet.finalize();
});
test('RasterSet#accepts the latest completed request', async () => {
  let resolveFirst;
  let resolveSecond;
  const rasterSet = new RasterSet({
    async getMetadata() {
      return {width: 4, height: 2, bandCount: 1, dtype: 'float32'};
    },
    getRaster(parameters) {
      return new Promise(resolve => {
        if (parameters.viewport.width === 1) {
          resolveFirst = () =>
            resolve({
              data: new Float32Array([1]),
              width: 1,
              height: 1,
              bandCount: 1,
              dtype: 'float32'
            });
        } else {
          resolveSecond = () =>
            resolve({
              data: new Float32Array([2, 2, 2, 2]),
              width: 2,
              height: 2,
              bandCount: 1,
              dtype: 'float32'
            });
        }
      }) as Promise<any>;
    }
  });
  rasterSet.requestRaster({viewport: createViewport(1, 1)});
  rasterSet.requestRaster({viewport: createViewport(2, 2)});
  resolveSecond?.();
  await new Promise(resolve => setTimeout(resolve, 0));
  resolveFirst?.();
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(rasterSet.raster?.width).toBe(2);
  expect(rasterSet.currentRequest?.requestId).toBe(1);
  rasterSet.finalize();
});
test('RasterSet#emits metadata and raster errors', async () => {
  const metadataErrors: string[] = [];
  const rasterErrors: string[] = [];
  let metadataFailed = true;
  let rasterFailed = true;
  const rasterSet = new RasterSet({
    async getMetadata() {
      if (metadataFailed) {
        throw new Error('metadata boom');
      }
      return {width: 4, height: 2, bandCount: 1, dtype: 'uint8'};
    },
    async getRaster() {
      if (rasterFailed) {
        throw new Error('raster boom');
      }
      return {
        data: new Uint8Array([1, 2, 3, 4]),
        width: 2,
        height: 2,
        bandCount: 1,
        dtype: 'uint8'
      } as any;
    }
  });
  rasterSet.subscribe({
    onMetadataLoadError: error => metadataErrors.push(error.message),
    onRasterLoadError: (_requestId, error) => rasterErrors.push(error.message)
  });
  await rasterSet.loadMetadata().catch(() => {});
  rasterSet.requestRaster({viewport: createViewport(1, 1)});
  await new Promise(resolve => setTimeout(resolve, 0));
  metadataFailed = false;
  rasterFailed = false;
  await rasterSet.loadMetadata();
  rasterSet.requestRaster({viewport: createViewport(2, 2)});
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(metadataErrors).toEqual(['metadata boom']);
  expect(rasterErrors).toEqual(['raster boom']);
  expect(rasterSet.metadata?.dtype).toBe('uint8');
  expect(rasterSet.raster?.width).toBe(2);
  rasterSet.finalize();
});
test('RasterSet#debounces raster requests', async () => {
  const calls: number[] = [];
  const rasterSet = new RasterSet({
    debounceTime: 5,
    async getMetadata() {
      return {width: 4, height: 2, bandCount: 1, dtype: 'uint16'};
    },
    async getRaster(parameters) {
      calls.push(parameters.viewport.width);
      return {
        data: new Uint16Array(parameters.viewport.width * parameters.viewport.height),
        width: parameters.viewport.width,
        height: parameters.viewport.height,
        bandCount: 1,
        dtype: 'uint16'
      } as any;
    }
  });
  rasterSet.requestRaster({viewport: createViewport(1, 1)});
  rasterSet.requestRaster({viewport: createViewport(2, 2)});
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(calls).toEqual([2]);
  expect(rasterSet.raster?.width).toBe(2);
  rasterSet.finalize();
});
test('RasterSet#emits loading state changes', async () => {
  let resolveRaster;
  const loadingStates: boolean[] = [];
  const rasterSet = new RasterSet({
    async getMetadata() {
      return {width: 4, height: 2, bandCount: 1, dtype: 'uint8'};
    },
    getRaster() {
      return new Promise(resolve => {
        resolveRaster = () =>
          resolve({
            data: new Uint8Array([1]),
            width: 1,
            height: 1,
            bandCount: 1,
            dtype: 'uint8'
          });
      }) as Promise<any>;
    }
  });
  rasterSet.subscribe({
    onLoadingStateChange: isLoading => loadingStates.push(isLoading)
  });
  rasterSet.requestRaster({viewport: createViewport(1, 1)});
  await new Promise(resolve => setTimeout(resolve, 0));
  resolveRaster?.();
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(loadingStates).toEqual([true, false]);
  rasterSet.finalize();
});
test('RasterSet#supports custom refetch policies', async () => {
  const calls: number[] = [];
  const rasterSet = new RasterSet({
    shouldRefetch: ({currentRequest, nextParameters}) =>
      !currentRequest || currentRequest.parameters.viewport.width !== nextParameters.viewport.width,
    async getMetadata() {
      return {width: 4, height: 2, bandCount: 1, dtype: 'uint8'};
    },
    async getRaster(parameters) {
      calls.push(parameters.viewport.width);
      return {
        data: new Uint8Array(parameters.viewport.width * parameters.viewport.height),
        width: parameters.viewport.width,
        height: parameters.viewport.height,
        bandCount: 1,
        dtype: 'uint8'
      } as any;
    }
  });
  rasterSet.requestRaster({viewport: createViewport(2, 2)});
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(rasterSet.shouldRefetchRaster({viewport: createViewport(2, 2)})).toBe(false);
  rasterSet.requestRaster({viewport: createViewport(2, 2)});
  rasterSet.requestRaster({viewport: createViewport(3, 2)});
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(calls).toEqual([2, 3]);
  expect(rasterSet.currentRequest?.parameters.viewport.width).toBe(3);
  rasterSet.finalize();
});

test('RasterSet composes caller cancellation and keeps the newest controller after old cleanup', async () => {
  const signals: AbortSignal[] = [];
  const completions: (() => void)[] = [];
  const rasterSet = RasterSet.fromCallbacks({
    getMetadata: async () => ({width: 1, height: 1, bandCount: 1, dtype: 'uint8'}),
    getRaster: (parameters: {signal?: AbortSignal}) => {
      signals.push(parameters.signal!);
      return new Promise(resolve =>
        completions.push(() =>
          resolve({data: new Uint8Array([1]), width: 1, height: 1, bandCount: 1, dtype: 'uint8'})
        )
      );
    }
  });
  const caller = new AbortController();
  rasterSet.requestRaster({signal: caller.signal});
  rasterSet.requestRaster({signal: caller.signal});
  expect(signals[0].aborted).toBe(true);
  completions[0]();
  await Promise.resolve();
  await Promise.resolve();
  caller.abort('caller reason');
  expect(signals[1].reason).toBe('caller reason');
  completions[1]();
  await Promise.resolve();
  expect(rasterSet.raster).toBeNull();
  rasterSet.finalize();
  expect(rasterSet.requestRaster({})).toBe(-1);
});

test('RasterSet releases loading state when immutable requests cancel and callbacks ignore signals', async () => {
  let failWork!: (error: Error) => void;
  const states: boolean[] = [];
  const failures: Error[] = [];
  const controller = new AbortController();
  const parameters = Object.freeze({signal: controller.signal, selection: 'retained'});
  let receivedParameters: typeof parameters | undefined;
  const rasterSet = RasterSet.fromCallbacks({
    getMetadata: async () => ({width: 1, height: 1, bandCount: 1, dtype: 'uint8'}),
    getRaster: (request: typeof parameters) => {
      receivedParameters = request;
      return new Promise<any>((_resolve, reject) => {
        failWork = reject;
      });
    }
  });
  rasterSet.subscribe({
    onLoadingStateChange: state => states.push(state),
    onRasterLoadError: (_requestId, error) => failures.push(error)
  });
  rasterSet.requestRaster(parameters);
  expect(receivedParameters?.selection).toBe('retained');
  expect(receivedParameters?.signal).not.toBe(controller.signal);
  controller.abort('caller reason');
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(states).toEqual([true, false]);
  expect(parameters.signal).toBe(controller.signal);
  failWork(new Error('obsolete callback failure'));
  await Promise.resolve();
  expect(failures).toEqual([]);
  rasterSet.finalize();
});

test('RasterSet metadata cancellation never publishes obsolete data and replacement callbacks use the new source', async () => {
  const borrowed = createRasterSource();
  const rasterSet = RasterSet.fromRasterSource(borrowed as any);
  const controller = new AbortController();
  let complete!: (metadata: any) => void;
  rasterSet.setOptions({
    getMetadata: () =>
      new Promise(resolve => {
        complete = resolve;
      })
  });
  const pending = rasterSet.loadMetadata({signal: controller.signal});
  controller.abort('obsolete metadata');
  await expect(pending).rejects.toBe('obsolete metadata');
  complete({width: 9, height: 9, bandCount: 1, dtype: 'uint8'});
  await Promise.resolve();
  expect(rasterSet.metadata).toBeNull();
  const replacement = {
    ...createRasterSource(),
    getMetadata: async () => ({
      name: 'replacement',
      width: 2,
      height: 2,
      bandCount: 1,
      dtype: 'uint8' as const
    })
  };
  rasterSet.setOptions({rasterSource: replacement as any});
  expect((await rasterSet.loadMetadata()).name).toBe('replacement');
  rasterSet.finalize();
});
