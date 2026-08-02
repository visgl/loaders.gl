// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {SourceLayer, type SourceLayerProps} from '@loaders.gl/deck-layers';

const TEST_3D_LOADER = {
  id: '3d-tiles',
  name: '3D Tiles',
  module: '3d-tiles',
  version: '0.0.0'
};

/** Creates a source dispatcher without requiring a deck.gl rendering context. */
function createSourceLayer(props: SourceLayerProps): SourceLayer {
  return new SourceLayer(props as any);
}

test('SourceLayer#preserves URL inputs for browser 3D loader dispatch', t => {
  const tilesetUrl = 'https://example.com/tileset.json';
  const layer = createSourceLayer({
    id: 'tiles-3d',
    data: tilesetUrl,
    loaders: [TEST_3D_LOADER as any]
  });

  t.equal(layer.props.data, tilesetUrl, 'data is not replaced by deck.gl async prop handling');

  const resolvedData = (layer as any)._resolveData(layer.props);
  (layer as any).state = {resolvedData};
  const renderedLayers = layer.renderLayers() as any[];

  t.equal(resolvedData, tilesetUrl, 'URL is retained for the 3D child layer');
  t.equal(renderedLayers[0].constructor.layerName, 'Tile3DSourceLayer');
  t.equal(renderedLayers[0].id, 'tiles-3d-tiles-3d', 'child layer has a unique sublayer id');
  t.equal(renderedLayers[0].props.loaders[0], TEST_3D_LOADER);
  t.end();
});
