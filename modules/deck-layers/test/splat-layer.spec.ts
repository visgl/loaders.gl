// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
import {SplatLayer, type SplatLayerProps} from '@loaders.gl/deck-layers';

/** Creates a SplatLayer instance for testing. */
function createLayer(props: SplatLayerProps): SplatLayer {
  return new SplatLayer({
    id: 'test-splat-layer',
    ...props
  });
}

/** Creates a minimal Gaussian splat Arrow table. */
function createGaussianSplatTable(): arrow.Table {
  return arrow.tableFromArrays({
    POSITION: [
      [0, 0, 0],
      [1, 2, 3]
    ],
    f_dc_0: [0, 1],
    f_dc_1: [0, 0],
    f_dc_2: [0, -1],
    opacity: [0, 2],
    scale_0: [0, 1],
    scale_1: [0, 0],
    scale_2: [0, -1],
    rot_0: [1, 1],
    rot_1: [0, 0],
    rot_2: [0, 0],
    rot_3: [0, 0]
  });
}

test('SplatLayer renders Gaussian splat Arrow table through binary attributes', t => {
  const layer = createLayer({data: createGaussianSplatTable()});
  const sublayer = layer.renderLayers() as any;
  const data = sublayer.props.data;

  t.equal(sublayer.constructor.layerName, 'SplatPrimitiveLayer', 'creates primitive splat layer');
  t.equal(data.length, 2, 'passes one rendered object per splat');
  t.deepEqual(
    Array.from(data.attributes.getPosition.value),
    [0, 0, 0, 1, 2, 3],
    'passes interleaved positions'
  );
  t.equal(data.attributes.getRadius.value[0], 3, 'decodes first log scale support radius');
  t.ok(
    Math.abs(data.attributes.getRadius.value[1] - Math.exp(0) * 3) < 1e-6,
    'decodes second log scale support radius from geometric mean'
  );
  t.deepEqual(
    Array.from(data.attributes.getColor.value.slice(0, 4)),
    [128, 128, 128, 128],
    'derives first color from SH DC and logit opacity'
  );
  t.end();
});
