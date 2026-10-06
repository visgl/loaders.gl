// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {ClusterLayer} from '@loaders.gl/deck-layers';
import {ClusterSource} from '@loaders.gl/geoarrow';
import {VectorSet} from '../src/vector-source-layer/vector-set';
import type {GetFeaturesParameters} from '@loaders.gl/loader-utils';

test('ClusterLayer renders shared pickable cluster objects with count labels and configurable styles', () => {
  const source = new ClusterSource(
    {
      shape: 'geojson-table',
      type: 'FeatureCollection',
      features: [
        {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [0, 0]}},
        {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [0.01, 0]}}
      ]
    },
    {maxZoom: 1}
  );
  const layer = new ClusterLayer({id: 'clusters', data: source, markerProps: {getRadius: 22}});
  const runtime = layer as any;
  runtime.setState = (state: any) => {
    runtime.state = {...runtime.state, ...state};
  };
  runtime.context = {viewport: {getBounds: () => [-180, -90, 180, 90], zoom: 0}};
  layer.initializeState();
  expect(layer.shouldUpdateState()).toBe(true);
  layer.updateState({changeFlags: {dataChanged: true}} as any);
  const [markers, labels] = layer.renderLayers();
  expect(markers.props.data).toBe(labels.props.data);
  expect(markers.props.getRadius).toBe(22);
  expect(markers.props.pickable).toBe(true);
  const node = runtime.state.nodes[0];
  expect((labels.props.getText as Function)(node)).toBe('2');
  expect((markers.props.getPosition as Function)(node)).toEqual(node.position);
  runtime.context.viewport.zoom = 2;
  layer.updateState({changeFlags: {viewportChanged: true}} as any);
  expect(runtime.state.nodes).toHaveLength(2);
  expect((labels.props.getText as Function)(runtime.state.nodes[0])).toBe('');
});

test('VectorSet forwards zoom and invalidates identical-bound queries when scale changes', async () => {
  const getFeatures = vi.fn(
    async (_parameters: GetFeaturesParameters) =>
      ({shape: 'geojson-table', type: 'FeatureCollection', features: []}) as const
  );
  const source = {
    getFeatures,
    getMetadata: async () => ({name: 'clusters', keywords: [], layers: [{name: 'clusters'}]}),
    getSchema: async () => ({fields: [], metadata: {}})
  };
  const vectorSet = VectorSet.fromVectorSource(source as any, {
    layers: 'clusters',
    debounceTime: 0
  });
  const viewport = {getBounds: () => [-180, -90, 180, 90], zoom: 1};
  await vectorSet.updateViewport(viewport as any);
  await vectorSet.updateViewport(viewport as any);
  expect(getFeatures).toHaveBeenCalledTimes(1);
  viewport.zoom = 2;
  await vectorSet.updateViewport(viewport as any);
  expect(getFeatures).toHaveBeenCalledTimes(2);
  expect(getFeatures.mock.calls[1][0]).toMatchObject({zoom: 2});
  vectorSet.finalize();
});
